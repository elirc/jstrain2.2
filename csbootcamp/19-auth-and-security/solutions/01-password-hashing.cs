// ─────────────────────────────────────────────────────────────────────────
//  01 · password hashing — SOLUTION                       ★★☆ core
//  concepts: PBKDF2 · per-user salt · constant-time comparison
//  run: dotnet run 01-password-hashing.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Three defences, and each one closes a specific attack.
//
//  The SALT is random per call, which is why hashing the same password twice
//  produces different output. Without it, identical passwords produce
//  identical hashes: an attacker who cracks one account gets every account
//  sharing that password for free, and precomputed rainbow tables work
//  directly. The salt is not a secret — it is stored in the clear next to the
//  hash — it just has to be unique.
//
//  The ITERATION COUNT makes each guess expensive. SHA-256 on its own is
//  wrong here precisely because it is fast: a GPU does billions per second.
//  PBKDF2 at 100k iterations turns a billion guesses/sec into ten thousand.
//  Storing the count in the record is what lets you raise it later — old
//  hashes keep verifying at their original cost, and you re-hash on next
//  login.
//
//  `FixedTimeEquals` is the subtle one. `a.SequenceEqual(b)` returns as soon
//  as two bytes differ, so the time it takes reveals how many leading bytes
//  matched. Over enough requests an attacker reconstructs the hash byte by
//  byte — a timing attack. FixedTimeEquals always compares every byte.
//
//  The try/catch around parsing is not laziness: `Verify` is reachable from
//  unauthenticated input, and a malformed record must be a failed login, not
//  a 500 that tells an attacker their input reached the crypto layer.
//
//  In a real app, prefer ASP.NET Core Identity's `PasswordHasher<T>` or a
//  memory-hard algorithm (Argon2id, scrypt), which resist GPU attacks better
//  than PBKDF2. This is the mechanism, spelled out.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Security.Cryptography;
using System.Text;

const int Iterations = 100_000;
const int SaltBytes = 16;
const int HashBytes = 32;

string Hash(string password)
{
    // Unique per call — this is what defeats rainbow tables.
    var salt = RandomNumberGenerator.GetBytes(SaltBytes);

    var hash = Rfc2898DeriveBytes.Pbkdf2(
        Encoding.UTF8.GetBytes(password),
        salt,
        Iterations,
        HashAlgorithmName.SHA256,
        HashBytes);

    return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
}

bool Verify(string stored, string password)
{
    try
    {
        var parts = stored.Split('.');
        if (parts.Length != 3) return false;

        var iterations = int.Parse(parts[0]);
        var salt = Convert.FromBase64String(parts[1]);
        var expected = Convert.FromBase64String(parts[2]);

        // Re-derive using the SAME salt and cost recorded in the record.
        var actual = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expected.Length);

        // Never SequenceEqual: early exit leaks a timing signal.
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
    catch (Exception e) when (e is FormatException or OverflowException
                                or ArgumentException)
    {
        // Unauthenticated input reaches here — a bad record is a failed
        // login, not a 500.
        return false;
    }
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the right password verifies", () =>
    Ok(Verify(Hash("hunter2"), "hunter2")));

Test("the wrong password does not", () =>
    Ok(!Verify(Hash("hunter2"), "hunter3")));

Test("verification is case sensitive", () =>
    Ok(!Verify(Hash("hunter2"), "Hunter2")));

Test("the plaintext never appears in the stored value", () =>
    Ok(!Hash("hunter2").Contains("hunter2")));

Test("the same password hashes differently every time", () =>
    Ok(Hash("hunter2") != Hash("hunter2")));

Test("both of those still verify", () =>
{
    var password = "correct horse battery staple";
    Ok(Verify(Hash(password), password));
    Ok(Verify(Hash(password), password));
});

Test("the stored format carries its iteration count", () =>
{
    var parts = Hash("hunter2").Split('.');
    Eq(parts.Length, 3);
    Eq(int.Parse(parts[0]), Iterations);
});

Test("a malformed stored value returns false instead of throwing", () =>
{
    Ok(!Verify("garbage", "hunter2"));
    Ok(!Verify("", "hunter2"));
    Ok(!Verify("100000.notbase64!.x", "hunter2"));
});

Test("an empty password is still hashable and verifiable", () =>
{
    var stored = Hash("");
    Ok(Verify(stored, ""));
    Ok(!Verify(stored, "x"));
});
