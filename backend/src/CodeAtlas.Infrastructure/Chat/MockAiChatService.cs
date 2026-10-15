using System.Runtime.CompilerServices;
using CodeAtlas.Application.Interfaces;

namespace CodeAtlas.Infrastructure.Chat;

/// <summary>
/// Demo AI tutor. Produces a reasonably helpful, keyword-aware canned reply and streams it
/// word-by-word to simulate typing. Swap for OpenAiChatService later by setting
/// "AiProvider": "OpenAI" in configuration once that implementation is complete.
/// </summary>
public class MockAiChatService : IAiChatService
{
    private static readonly (string[] Keywords, string Reply)[] Templates =
    {
        (new[] { "closure", "closures" },
            "A **closure** is a function that remembers the variables from the scope it was created in, " +
            "even after that outer scope has finished executing. This is how you get private state in JavaScript.\n\n" +
            "```javascript\nfunction makeCounter() {\n  let count = 0;\n  return function increment() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```\n\n" +
            "Notice that `count` isn't accessible from outside — only through the returned function, which keeps a reference to it."),

        (new[] { "async", "asynchronous", "await", "promise", "promises" },
            "**Async/await** is syntactic sugar over Promises that lets asynchronous code read like synchronous code. " +
            "An `async` function always returns a Promise, and `await` pauses execution until that Promise settles.\n\n" +
            "```javascript\nasync function fetchUser(id) {\n  const response = await fetch(`/api/users/${id}`);\n  if (!response.ok) throw new Error('Request failed');\n  return response.json();\n}\n```\n\n" +
            "Wrap `await` calls in `try/catch` to handle rejected promises gracefully."),

        (new[] { "linq" },
            "**LINQ** (Language Integrated Query) lets you query collections in C# using a consistent, declarative syntax " +
            "instead of manual loops.\n\n" +
            "```csharp\nvar adults = people\n    .Where(p => p.Age >= 18)\n    .OrderBy(p => p.LastName)\n    .Select(p => p.FullName)\n    .ToList();\n```\n\n" +
            "Under the hood, most LINQ methods use deferred execution — the query doesn't actually run until you enumerate it (e.g. with `ToList()` or a `foreach`)."),

        (new[] { "loop", "loops", "for loop", "while loop" },
            "Loops let you repeat a block of code. The three most common forms are `for` (when you know the number of iterations), " +
            "`while` (when you loop until a condition changes), and `for...of`/`foreach` (when iterating a collection).\n\n" +
            "```javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n```\n\n" +
            "Watch out for off-by-one errors and infinite loops — always make sure your loop's condition will eventually become false."),

        (new[] { "array", "arrays" },
            "Arrays are ordered collections of values. Most modern languages give you higher-order methods " +
            "(`map`, `filter`, `reduce`) so you rarely need manual index-based loops.\n\n" +
            "```javascript\nconst nums = [1, 2, 3, 4, 5];\nconst doubledEvens = nums\n  .filter(n => n % 2 === 0)\n  .map(n => n * 2);\n\nconsole.log(doubledEvens); // [4, 8]\n```"),

        (new[] { "javascript", "js" },
            "JavaScript is the dynamic, single-threaded scripting language that runs in every browser (and on servers via Node.js). " +
            "Its event loop lets it handle asynchronous work — timers, network calls, user input — without blocking.\n\n" +
            "```javascript\nconsole.log('first');\nsetTimeout(() => console.log('third'), 0);\nconsole.log('second');\n// Logs: first, second, third\n```\n\n" +
            "A good next step is to make sure you're comfortable with `var`/`let`/`const` scoping and the differences between them."),

        (new[] { "c#", "csharp", ".net", "dotnet" },
            "C# is a strongly-typed, object-oriented language that runs on .NET. It compiles to IL (Intermediate Language), " +
            "which the CLR then JIT-compiles to native code at runtime.\n\n" +
            "```csharp\npublic record Point(int X, int Y)\n{\n    public double DistanceFromOrigin() => Math.Sqrt(X * X + Y * Y);\n}\n```\n\n" +
            "Records like this one give you value-based equality and immutability for free — great for DTOs."),

        (new[] { "recursion", "recursive" },
            "**Recursion** is when a function calls itself to break a problem into smaller sub-problems. Every recursive function " +
            "needs a base case (to stop) and a recursive case (to make progress toward it).\n\n" +
            "```javascript\nfunction factorial(n) {\n  if (n <= 1) return 1; // base case\n  return n * factorial(n - 1); // recursive case\n}\n```\n\n" +
            "If you skip the base case, you'll blow the call stack with a `RangeError`/`StackOverflowException`.")
    };

    private static readonly string[] GenericReplies =
    {
        "That's a great question! I'm currently running as a **demo AI tutor** with canned responses — real OpenAI-powered " +
        "answers tailored to exactly what you ask are coming soon. In the meantime, try asking about closures, async/await, " +
        "LINQ, loops, arrays, or recursion and I'll walk you through an example.",

        "Thanks for reaching out. This mock tutor doesn't have a tailored answer for that exact phrasing yet, but once the " +
        "real AI integration ships, I'll be able to reason about your specific question in context. For now, feel free to " +
        "browse the relevant lesson for this topic, or ask me about a core programming concept like promises or arrays.",

        "I hear you! Right now I'm a placeholder AI tutor (no live model wired up), so my answers are limited to a handful " +
        "of common topics — think closures, loops, async code, LINQ, and recursion. Ask me about one of those and I'll give " +
        "you a worked example with code."
    };

    public async IAsyncEnumerable<string> StreamReplyAsync(
        string userMessage,
        string? topicContext,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var reply = BuildReply(userMessage, topicContext);
        var words = reply.Split(' ');

        for (var i = 0; i < words.Length; i++)
        {
            ct.ThrowIfCancellationRequested();
            yield return i == 0 ? words[i] : " " + words[i];
            await Task.Delay(Random.Shared.Next(30, 60), ct);
        }
    }

    private static string BuildReply(string userMessage, string? topicContext)
    {
        var lower = userMessage.ToLowerInvariant();

        foreach (var (keywords, reply) in Templates)
        {
            if (keywords.Any(k => lower.Contains(k)))
            {
                return topicContext != null
                    ? $"{reply}\n\n_(Context: this conversation is linked to the topic \"{topicContext}\".)_"
                    : reply;
            }
        }

        var generic = GenericReplies[Random.Shared.Next(GenericReplies.Length)];
        return topicContext != null
            ? $"{generic}\n\n_(Context: this conversation is linked to the topic \"{topicContext}\".)_"
            : generic;
    }
}
