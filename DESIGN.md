# Design: Bulls and Cows

## Data structures and state

- `RoundSettings` in `src/main.ts` stores the selected number base and secret length. When a round starts, the settings are copied into the game state so the running round uses a fixed configuration.
- `GameState` stores the secret as a string, the start time as a timestamp, the status (`playing` or `won`), and the attempt history. Keeping the secret as a string preserves leading zeroes, for example `0123`.
- Each history entry is a `GuessRecord`: the submitted guess and its bulls/cows counts. A new attempt replaces the state with a new object and a new array (`[...game.guesses, record]`), so earlier history entries are not mutated.
- `ScoreRecord` stores the base, length, attempt count, and elapsed time. Records are saved under `bulls-and-cows:records` in `localStorage`. The leaderboard keeps up to five records per base/length pair and orders them by fewer attempts, then shorter time.
- `Map<string, number>` in `src/logic/countPossibleSecrets.ts` memoizes permutation counts. Its key combines length and base, such as `4:10`.

## Algorithms

### `generateSecret(length, base, random)`

The function builds a pool of the digits available in the selected base. For each position, it uses the injected random source to choose an index from the remaining pool, appends that digit to the result, and creates a new pool without the selected digit. Since a chosen digit is removed from the available pool, the secret has no repeated digits. The first digit is not treated specially, so zero may appear at the start.

Passing `random` makes the choice sequence controllable in tests. The default is `Math.random` for normal play.

### `evaluateGuess(secret, guess)`

Both strings are converted to lowercase digit arrays so hexadecimal letters compare without regard to case. A `map` plus `filter` counts bulls by comparing digits at matching indexes. Another `filter` counts guess digits present in the secret using `includes`. Cows are the total matching digits minus bulls.

The game calls this function with a generated secret and a guess that has already passed `isValidGuess`, so both strings contain unique digits.

### `countPossibleSecrets(length, base)`

The function counts permutations without repetition using the recursive relation:

`P(base, length) = base × P(base - 1, length - 1)`

The base case is `P(base, 0) = 1`. Invalid inputs and lengths greater than the available base return zero. Before recursion, the function checks its `Map` cache; after calculating a result, it stores it under the `(length, base)` key.

## Complexity

Let `L` be the requested secret/guess length and `B` the number of available digits in the base. The game uses bases from 2 to 16 and lengths from 2 to 6.

| Function               | Time                                             | Extra space            | Reason                                                                                                                                                             |
| ---------------------- | ------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `generateSecret`       | `O(L × B)`                                       | `O(B + L)`             | It selects `L` digits. At each step, `filter` scans the remaining pool, which is at most `B` digits. The pool and generated result are stored in new arrays/state. |
| `evaluateGuess`        | `O(L²)`                                          | `O(L)`                 | The positional `map`/`filter` work is `O(L)`. Counting matching digits calls `includes` on a secret of up to `L` digits for each guess digit, giving `O(L²)`.      |
| `isValidGuess`         | `O(L × B)`                                       | `O(L)`                 | It checks each digit with a validator that slices/searches up to `B` symbols, then constructs a `Set` to detect duplicates.                                        |
| `countPossibleSecrets` | `O(L)` for a cold call; `O(1)` for a cached call | `O(L)` for a cold call | A cold recursive call visits one state per remaining position and uses constant-time average `Map` lookups. The call stack and newly cached states grow with `L`.  |

The `countPossibleSecrets` space estimate describes a cold call. Across many different calls, the module-level cache can retain additional `(length, base)` results until the page is closed.

## Clean code and functional style

- **Small functions with one clear job:** `createDigitValidator` in `src/logic/digits.ts` creates a digit predicate; `isValidGuess` checks a full attempt; `evaluateGuess` calculates feedback; and `generateSecret` creates the secret.
- **Meaningful names and explicit inputs:** the required functions name their inputs (`secret`, `guess`, `length`, `base`, `random`) and return values with clear types such as `GuessEvaluation`.
- **Guard clauses:** `generateSecret`, `isValidGuess`, and `countPossibleSecrets` reject invalid arguments before running their main algorithms.
- **Higher-order array methods:** `generateSecret` uses `reduce` and `filter`; `evaluateGuess` uses `map` and `filter`; `isValidGuess` uses `every`. This keeps the game logic declarative and avoids manual counter loops.
- **Currying:** `createDigitValidator(base)` returns a reusable `(char) => boolean` predicate. `isValidGuess` uses it to check every character, and the input handler in `src/main.ts` uses it to remove characters that are invalid for the current base.
- **Immutability:** each accepted attempt creates a new `GameState` object and a new history array in `src/main.ts`. `generateSecret` also creates a new remaining-digit array instead of changing the previous pool.
- **Dependency injection:** `generateSecret` accepts a random-number function, allowing its tests in `src/logic/secrets.test.ts` to use a deterministic source.
- **Separation of concerns:** files under `src/logic/` contain game rules without DOM access. `src/main.ts` handles DOM events, rendering, the clock, and `localStorage`.
- **Safe dynamic content:** UI text is inserted with `textContent` and nodes are built with DOM methods. The app does not use `innerHTML` or `insertAdjacentHTML` for dynamic content.
