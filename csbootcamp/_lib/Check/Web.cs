// Web.cs — the web half of the harness.
//
// ASP.NET Core exercises need a running server and a client pointed at it.
// Doing that by hand is six lines of ceremony per exercise, so it lives here:
//
//     await using var app = await Web.Serve(app => {
//         app.MapGet("/ping", () => "pong");
//     });
//     Eq(await app.Client.GetStringAsync("/ping"), "pong");
//
// This runs a REAL Kestrel server on a random loopback port and talks to it
// over real HTTP. No mocks, no WebApplicationFactory, no NuGet — which means
// what you learn here is what happens in production, and it still works on a
// plane with the wifi off.

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Bootcamp;

/// <summary>Carries an unimplemented-handler signal out of the server.</summary>
internal sealed class TodoBox
{
    public NotImplementedException? Pending;
}

/// <summary>A running app plus a client aimed at it. Dispose stops the server.</summary>
public sealed class ServedApp : IAsyncDisposable
{
    private readonly TodoBox _todo;

    public WebApplication App { get; }
    public HttpClient Client { get; }
    public string BaseAddress { get; }

    internal ServedApp(WebApplication app, HttpClient client, string baseAddress, TodoBox todo)
        => (App, Client, BaseAddress, _todo) = (app, client, baseAddress, todo);

    // A stub inside a request handler throws on the SERVER thread, where the
    // test can't see it — the client would just get an opaque 500 and the
    // harness would report a failure instead of "you haven't written it yet".
    // Web.Serve records that exception; this replays it on the test thread so
    // the exercise reports `☐ todo`, exactly like a non-web stub.
    private void RethrowIfUnimplemented()
    {
        if (_todo.Pending is { } pending)
        {
            _todo.Pending = null;
            throw new NotImplementedException(pending.Message, pending);
        }
    }

    /// <summary>GET the path and return the raw body, whatever the status.</summary>
    public async Task<string> GetBody(string path)
    {
        var response = await Client.GetAsync(path);
        RethrowIfUnimplemented();
        return await response.Content.ReadAsStringAsync();
    }

    /// <summary>GET the path and return just the status code as an int.</summary>
    public async Task<int> GetStatus(string path)
    {
        var response = await Client.GetAsync(path);
        RethrowIfUnimplemented();
        return (int)response.StatusCode;
    }

    /// <summary>POST a value as JSON and return the response.</summary>
    public async Task<HttpResponseMessage> PostJson<T>(string path, T body)
    {
        var response = await Client.PostAsync(path, JsonContent(body));
        RethrowIfUnimplemented();
        return response;
    }

    /// <summary>PUT a value as JSON and return the response.</summary>
    public async Task<HttpResponseMessage> PutJson<T>(string path, T body)
    {
        var response = await Client.PutAsync(path, JsonContent(body));
        RethrowIfUnimplemented();
        return response;
    }

    /// <summary>POST form fields as application/x-www-form-urlencoded.</summary>
    public async Task<HttpResponseMessage> PostForm(
        string path, params (string Key, string Value)[] fields)
    {
        var content = new FormUrlEncodedContent(
            fields.Select(f => new KeyValuePair<string, string>(f.Key, f.Value)));
        var response = await Client.PostAsync(path, content);
        RethrowIfUnimplemented();
        return response;
    }

    /// <summary>Send any request and return the response.</summary>
    public async Task<HttpResponseMessage> Send(HttpRequestMessage request)
    {
        var response = await Client.SendAsync(request);
        RethrowIfUnimplemented();
        return response;
    }

    private static StringContent JsonContent<T>(T body)
        => new(System.Text.Json.JsonSerializer.Serialize(body),
               System.Text.Encoding.UTF8, "application/json");

    public async ValueTask DisposeAsync()
    {
        Client.Dispose();
        try { await App.StopAsync(TimeSpan.FromSeconds(5)); } catch { /* already down */ }
        await App.DisposeAsync();
    }
}

public static class Web
{
    /// <summary>
    /// Build and start an app on a random loopback port, then hand back a
    /// client pointed at it. <paramref name="configure"/> wires the endpoints
    /// and middleware; <paramref name="services"/> runs before Build() if you
    /// need to register something in DI.
    /// </summary>
    public static async Task<ServedApp> Serve(
        Action<WebApplication> configure,
        Action<WebApplicationBuilder>? services = null)
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        // Exercise output is a test report; server logs would drown it.
        builder.Logging.ClearProviders();
        builder.Logging.SetMinimumLevel(LogLevel.None);
        services?.Invoke(builder);

        var app = builder.Build();

        // First in the pipeline, so it wraps everything the exercise adds.
        // Only NotImplementedException is intercepted: every other exception
        // still reaches the app's own error handling, which modules 14 and 16
        // deliberately exercise.
        var todo = new TodoBox();
        app.Use(async (ctx, next) =>
        {
            try
            {
                await next(ctx);
            }
            catch (NotImplementedException ex)
            {
                todo.Pending = ex;
                ctx.Response.StatusCode = StatusCodes.Status501NotImplemented;
            }
        });

        configure(app);
        await app.StartAsync();

        var address = app.Urls.First();
        var client = new HttpClient
        {
            BaseAddress = new Uri(address),
            Timeout = TimeSpan.FromSeconds(10),
        };
        return new ServedApp(app, client, address, todo);
    }

    /// <summary>
    /// Shorthand for the common case: one delegate that gets the builder AND
    /// the app, for exercises that register services and endpoints together.
    /// </summary>
    public static Task<ServedApp> Serve(Action<WebApplicationBuilder> services,
                                        Action<WebApplication> configure)
        => Serve(configure, services);
}
