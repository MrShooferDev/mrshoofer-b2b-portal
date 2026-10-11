# Adding a component cheaply

1. **Open a new chat.** Never continue a long one: every step re-sends the whole conversation.
2. **Pick the cheapest model** in the model picker (Composer Fast or similar) before sending.
3. **Send one message** with everything:

```text
Add this component to the Create Account page.
Source: <paste the code, or the demo URL>
Persian texts: <labels, or "translate the originals">
Event: <what the page should hear, e.g. "when the selection changes">
Changes: <anything different from the original>
```

4. **Check it yourself** by refreshing `http://localhost:5055/CreateAccount` (start the app with `dotnet run --urls http://localhost:5055` if needed).
5. **Send all fixes in one message**, in the same chat.

Add the word `verify` only when you want the agent to test in the browser (costs noticeably more).

| Setup | Rough cost per component |
|---|---|
| New chat + cheap model + budget mode | about $0.03–0.10 |
| Same, with `verify` | about $0.15–0.30 |
| Long chat + strong model + browser testing (what we did here) | about $0.60–1.00 |
