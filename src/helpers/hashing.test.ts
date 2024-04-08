import { test, expect, assert } from "vitest"
import { passwordHash, passwordCheck } from "./hashing"

test("passwordHash generates hash successfully", async () => {
  const hashResult = await passwordHash("password")

  expect(hashResult.success).toBeTruthy()
  if (hashResult.success) {
    expect(hashResult.value).toBeDefined()
  } else {
    assert(false, `passwordHash failed with error: ${hashResult.error}`)
  }
})

test("passwordCheck verifies matching passwords", async () => {
  // Generate a hash for the password
  const hashResult = await passwordHash("password")
  assert(hashResult.success === true, "passwordHash should not fail")

  if (!hashResult.success) return

  // Check if the generated hash can be verified
  const matchResult = await passwordCheck("password", hashResult.value)

  expect(matchResult.success).toBeTruthy()
  if (matchResult.success) {
    expect(matchResult.value).toBeTruthy()
  } else {
    assert(false, `passwordCheck failed with error: ${matchResult.error}`)
  }
})

test("passwordCheck verifies non-matching passwords", async () => {
  // Generate a hash for the password
  const hashResult = await passwordHash("password")
  assert(hashResult.success === true, "passwordHash should not fail")

  if (!hashResult.success) return

  // Check if a different password can be verified against the generated hash
  const matchResult = await passwordCheck("wrongpassword", hashResult.value)

  expect(matchResult.success).toBeFalsy()
})
