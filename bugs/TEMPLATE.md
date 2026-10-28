# Bug report template

Bug drafts live in this directory as `BUG-<TC id>-<short-slug>.md`. A draft is not a ticket:
a human reviews it and files it in the tracker.

## Writing rules

- Use the What? Where? When? structure in Summary, Actual Result and Expected Result.
- Summary, Actual Result and Expected Result are one sentence each, in the passive voice.
- Do not speculate about causes. Describe observed behavior only.
- Steps begin with a verb and name the interface elements (buttons, fields) involved.
- Check the pre-conditions before writing. If none apply, write "None".
- Be precise and objective; keep interpretation to a minimum.

## Template

```
# <Summary>

- **Summary**: <One sentence, What? Where? When?, passive voice.>

- **Pre-conditions**: <State and data required before reproduction, or "None".>

- **Steps to Reproduce**:
  1. <Verb + user action>
  2. <Verb + user action, naming the button / field if relevant>
  3. ...

- **Actual Result**: <One sentence, What? Where? When?, passive voice.>

- **Expected Result**: <One sentence, What? Where? When?, passive voice.>
```

## Evidence (not part of the report body)

Add under the template when a draft comes from a failed test: the test case row (TC-xxx, step or
expected result), the spec file, and the trace / screenshot path.
