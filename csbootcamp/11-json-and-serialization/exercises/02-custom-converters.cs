// ─────────────────────────────────────────────────────────────────────────
//  02 · custom converters                                 ★★★ stretch
//  concepts: JsonConverter<T> · reading a token stream · tolerant input
//  run: dotnet run 02-custom-converters.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Sooner or later an API sends you something the default serialiser will
//  not accept — a money value as a string, a date in a non-ISO format, a
//  field that is sometimes a scalar and sometimes an array. A
//  `JsonConverter<T>` is the hook.
//
//      public override T Read(ref Utf8JsonReader reader, Type t, JsonSerializerOptions o)
//      public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions o)
//
//  `Utf8JsonReader` is a forward-only cursor over tokens. On entry to `Read`
//  it is already positioned on the first token of your value — you do NOT
//  call `Read()` first for a scalar.
//
//  Be **tolerant on input, strict on output**: accept the shapes real
//  callers send, emit exactly one shape.
//
//  hint: `reader.TokenType` tells you what you are looking at; for a scalar
//        just read it and return
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

// ──────────────────────────── tests ──────────────────────────────────────

Test("money is WRITTEN as a string, always with 2dp", () =>
    Eq(Json.To(new Payment(12.5m)), "{\"amount\":\"12.50\"}"));

Test("money is READ from a string", () =>
    Eq(Json.From<Payment>("{\"amount\":\"12.50\"}")?.Amount, 12.50m));

Test("money is ALSO read from a bare number — tolerant input", () =>
{
    // A different client sends it unquoted; accept both.
    Eq(Json.From<Payment>("{\"amount\":12.5}")?.Amount, 12.5m);
});

Test("money round-trips exactly", () =>
{
    var original = new Payment(0.1m + 0.2m);   // 0.3 exactly, in decimal
    Eq(Json.From<Payment>(Json.To(original))?.Amount, 0.3m);
});

Test("a malformed money value is a JsonException, not a silent zero", () =>
    Throws<JsonException>(() => Json.From<Payment>("{\"amount\":\"lots\"}")));

Test("tags read from a real array", () =>
    Eq(Json.From<Post>("{\"tags\":[\"a\",\"b\"]}")?.Tags, new[] { "a", "b" }));

Test("tags ALSO read from a single scalar", () =>
{
    // The classic awkward API: one value is a string, several are an array.
    Eq(Json.From<Post>("{\"tags\":\"solo\"}")?.Tags, new[] { "solo" });
});

Test("tags read from an empty array", () =>
    Eq(Json.From<Post>("{\"tags\":[]}")?.Tags, new List<string>()));

Test("tags are always WRITTEN as an array — strict output", () =>
{
    Eq(Json.To(new Post(["solo"])), "{\"tags\":[\"solo\"]}");
    Eq(Json.To(new Post([])), "{\"tags\":[]}");
});

Test("the converter round-trips a single tag into an array", () =>
{
    // In as a scalar, out as an array. One shape leaves the system.
    var post = Json.From<Post>("{\"tags\":\"solo\"}");
    Eq(Json.To(post!), "{\"tags\":[\"solo\"]}");
});

// ──────────────────────────── types ──────────────────────────────────────

public record Payment([property: JsonConverter(typeof(MoneyConverter))] decimal Amount);

public record Post([property: JsonConverter(typeof(FlexibleStringListConverter))]
                   List<string> Tags);

// Writes a decimal as a 2dp STRING; reads from either a string or a number.
public class MoneyConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type typeToConvert,
                                 JsonSerializerOptions options)
        => throw new NotImplementedException();

    public override void Write(Utf8JsonWriter writer, decimal value,
                               JsonSerializerOptions options)
        => throw new NotImplementedException();
}

// Reads a List<string> from EITHER a JSON array or a single string.
// Always writes an array.
public class FlexibleStringListConverter : JsonConverter<List<string>>
{
    public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert,
                                      JsonSerializerOptions options)
        => throw new NotImplementedException();

    public override void Write(Utf8JsonWriter writer, List<string> value,
                               JsonSerializerOptions options)
        => throw new NotImplementedException();
}

static class Json
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public static string To<T>(T value) => JsonSerializer.Serialize(value, Options);
    public static T? From<T>(string json) => JsonSerializer.Deserialize<T>(json, Options);
}
