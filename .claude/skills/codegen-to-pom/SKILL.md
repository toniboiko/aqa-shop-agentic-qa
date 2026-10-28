---
name: codegen-to-pom
description: Refactors a raw Playwright codegen recording into Page Objects and a readable spec — moves locators into Page Objects, turns runs of actions into methods named by intent, rewrites the spec to call them, adds the imports, and lifts hardcoded data out of the spec into a test data file. Use when a spec came out of `npx playwright codegen`. Never modifies specs or Page Objects other than the ones it declares.
---


Follow `CLAUDE.md` for project structure, how Page Objects expose locators, and test data rules.
Do not restate or override them here.


## 1. Read first, then declare


Read the spec the user named. If a Page Object for one of its pages already exists, **read it in
full** — you extend it, you never recreate it or rename what is already there.


Then list, before writing anything: the spec you will rewrite, every Page Object you will create or
extend with its path, and every file you will add under `test-data/`. Do exactly that and nothing
else. Never touch another spec, another Page Object you did not list, or `playwright.config.ts`.


## 2. Locators, methods, and the spec


A recording usually walks through more than one page. Give each page its own Page Object rather than
one class for the whole flow. If you cannot tell which page an action belongs to, put it with the
last page you are sure about and say so in the report.


**Locators** move into the Page Object as they are.


**Actions become methods named by intent** — `addToCart(productName)`, not `clickAddToCartButton()`.
A run of clicks and fills that serves one purpose is one method. A method that needs a value takes it
as an argument instead of hardcoding it.


**The spec** is rewritten to instantiate the Page Objects and call those methods, so it reads as a
sequence of business steps. Add the imports it now needs, with paths relative to the spec's folder.
Assertions stay in the spec.


## 3. Data


Every value typed during the recording sits in the spec as a literal. Move them all into one file
under `test-data/`, creating it if it does not exist, and have the spec read them from there.


Do not sort them and do not decide what belongs somewhere else — that is the user's call. Never
touch `.env`.


## 4. Clean up


- `test('test', …)` → a title describing the behaviour.
- Absolute URL in `goto` → relative path, if `baseURL` is set in the config. It is not → leave the
  URL and report it.


## 5. Run it


```
npx playwright test <the spec you rewrote>
```


That path is not optional — the one spec, not the whole suite. Report the real result.


## Output


- files created and changed, by path
- how many assertions the spec contains, including when the answer is zero
- every place you had to ask or guess, and what you would need to resolve it
