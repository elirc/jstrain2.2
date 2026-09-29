// ─────────────────────────────────────────────────────────────────────────
//  01 · password hashing                                  ★★☆ core
//  concepts: PBKDF2 · per-user salt · constant-time comparison
//  run: dotnet run 01-password-hashing.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Never store a password. Store something you can verify a password
//  against, and nothing else.
//
//  A plain SHA-256 hash is NOT enough. SHA-256 is designed to be fast, which
//  is exactly wrong here: a GPU does billions per second, so a leaked table
//  of unsalted hashes falls to a dictionary attack in minutes. You want a
//  DELIBERATELY SLOW function with a per-user salt.
//
//      Hash("hunter2")  → "<iterations>.<salt>.<hash>", all base64
//      Verify(stored, "hunter2")  → true
//      Verify(stored, "wrong")    → false
//
//  Three properties the tests check, and each one is a real attack:
//
//    · a random SALT per user  → two users with the same password get
//      different hashes, so one cracked hash doesn't crack the other, and
//      precomputed rainbow tables are useless
//    · many ITERATIONS         → makes each guess expensive
//    · CONSTANT-TIME compare   → an early-exit comparison leaks how many
//      bytes matched, and that is enough to reconstruct the hash byte by byte
//
//  hint: Rfc2898DeriveBytes.Pbkdf2(...) does the derivation;
//        CryptographicOperations.FixedTimeEquals does the comparison
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Security.Cryptography;
using System.Text;

const int Iterations = 100_000;
const int SaltBytes = 16;
const int HashBytes = 32;

// Produce "iterations.saltBase64.hashBase64".
string Hash(string password)
{
    throw new NotImplementedException();
}

// True when the password reproduces the stored hash. Must not throw on a
// malformed stored value — return false.
bool Verify(string stored, string password)
{
    throw new NotImplementedException();
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
{
    // A random salt per call — otherwise identical passwords collide and
    // one cracked hash cracks every account that shares it.
    Ok(Hash("hunter2") != Hash("hunter2"));
});

Test("both of those still verify", () =>
{
    var password = "correct horse battery staple";
    Ok(Verify(Hash(password), password));
    Ok(Verify(Hash(password), password));
});

Test("the stored format carries its iteration count", () =>
{
    // Storing the cost lets you raise it later without locking anyone out:
    // old hashes still verify at their original cost.
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
