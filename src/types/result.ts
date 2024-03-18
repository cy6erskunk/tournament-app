// Create a discriminating union which narrows the type for better errors
// Discriminating unions: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions
type ResultSuccess<T> = { success: true; value: T };
type ResultError<E> = { success: false; error: E };
export type Result<T, E> = ResultSuccess<T> | ResultError<E>;

// Example usage

// function divide(dividend: number, divisor: number): Result<number, string> {
//   if (divisor === 0) {
//     return { success: false, error: "Division by zero error" };
//   }
//   return { success: true, value: dividend / divisor };
// }

// const result1 = divide(10, 2); // ResultSuccess<number>
// const result2 = divide(10, 0); // ResultError<string>
