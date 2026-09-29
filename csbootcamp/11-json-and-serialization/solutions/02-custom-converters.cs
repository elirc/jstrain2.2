// ─────────────────────────────────────────────────────────────────────────
//  02 · custom converters — SOLUTION                      ★★★ stretch
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
//  Walkthrough:
//  Both converters follow the same principle: **tolerant on input, strict on
//  output.** Accept the shapes real callers actually send; emit exactly one
//  shape so your own consumers never have to branch.
//
//  `MoneyConverter` reads a `String` token or a `Number` token, and always
//  writes a 2dp string. Writing money as a JSON number is a genuine hazard:
//  JSON numbers are IEEE doubles in most parsers, so a JavaScript client
//  reading `0.1 + 0.2` gets `0.30000000000000004` — the exact problem
//  `decimal` exists to avoid (module 01/02). Sending a string preserves it.
//
//  Note the parse uses `InvariantCulture`. A converter runs wherever the
//  process runs, so a culture-sensitive parse would read `"12.50"` as 1250 on
//  a German server (module 01/07).
//
//  A malformed value throws `JsonException` rather than returning zero. That
//  matters: a silent default here means a payment of 0 that nobody notices.
//  Converters are a validation boundary as much as a formatting one.
//
//  `FlexibleStringListConverter` handles the API shape everyone eventually
//  meets — a member that is a bare string when there is one value and an
//  array when there are several. Switching on `reader.TokenType` covers both,
//  and `Write` always emits an array, so exactly one shape leaves the system.
//  The last test shows that normalisation: in as a scalar, out as an array.
//
//  Two mechanics of `Utf8JsonReader` worth internalising. It is a
//  **forward-only cursor** over tokens, and it is a `ref struct` — you cannot
//  capture it in a lambda, store it, or use it across an `await`. And on
//  entry to `Read` it is **already positioned** on the first token of your
//  value, so for a scalar you read it and return; only for an array do you
//  loop calling `reader.Read()` until `EndArray`.
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
    {
        // The reader is ALREADY on the value token — do not call Read() first.
        if (reader.TokenType == JsonTokenType.Number) return reader.GetDecimal();

        if (reader.TokenType == JsonTokenType.String)
        {
            var text = reader.GetString();
            // InvariantCulture: a converter runs wherever the process runs.
            if (decimal.TryParse(text, NumberStyles.Number,
                                 CultureInfo.InvariantCulture, out var parsed))
                return parsed;

            throw new JsonException($"not a valid amount: {text}");
        }

        throw new JsonException($"unexpected token for money: {reader.TokenType}");
    }

    public override void Write(Utf8JsonWriter writer, decimal value,
                               JsonSerializerOptions options)
        // A string, not a number: JSON numbers are doubles in most parsers,
        // which would reintroduce the float rounding decimal avoids.
        => writer.WriteStringValue(value.ToString("F2", CultureInfo.InvariantCulture));
}

// Reads a List<string> from EITHER a JSON array or a single string.
// Always writes an array.
public class FlexibleStringListConverter : JsonConverter<List<string>>
{
    public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert,
                                      JsonSerializerOptions options)
    {
        // Tolerant: a bare string is treated as a one-element list.
        if (reader.TokenType == JsonTokenType.String)
            return [reader.GetString() ?? ""];

        if (reader.TokenType != JsonTokenType.StartArray)
            throw new JsonException($"unexpected token for tags: {reader.TokenType}");

        var items = new List<string>();
        while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
        {
            if (reader.TokenType != JsonTokenType.String)
                throw new JsonException("tags must be strings");
            items.Add(reader.GetString() ?? "");
        }
        return items;
    }

    public override void Write(Utf8JsonWriter writer, List<string> value,
                               JsonSerializerOptions options)
    {
        // Strict: ALWAYS an array, so consumers never branch.
        writer.WriteStartArray();
        foreach (var item in value) writer.WriteStringValue(item);
        writer.WriteEndArray();
    }
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
