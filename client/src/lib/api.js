/**
 * api.js — Client-facing API layer.
 *
 * Never imports from or calls the LLM directly.
 * All requests go through the Express backend via the Vite proxy.
 *
 * Returns a discriminated union: { ok, data } | { ok, errorKind, message }
 * Never throws to the caller.
 */

// Client-side timeout: 25 seconds (5 s grace on top of the 20 s backend timeout)
const CLIENT_TIMEOUT_MS = 25_000;

/**
 * @typedef {'timeout'|'network'|'server'|'parse'|'empty'} ErrorKind
 *
 * @typedef {{ ok: true, data: object }} OkResult
 * @typedef {{ ok: false, errorKind: ErrorKind, message: string }} ErrResult
 * @typedef {OkResult | ErrResult} ApiResult
 */

/**
 * Generate a study set (flashcards or quiz) from user input.
 *
 * @param {string} prompt  - User notes or topic
 * @param {'flashcards'|'quiz'} mode
 * @param {AbortSignal} [externalSignal] - Optional signal from the caller for stale-request cancellation
 * @returns {Promise<ApiResult>}
 */
export async function generateStudySet(prompt, mode, externalSignal) {
  // Compose a combined AbortController: fires on client timeout OR external abort
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort('timeout'),
    CLIENT_TIMEOUT_MS
  );

  // Combine signals: abort if either fires
  const signal = externalSignal
    ? AbortSignal.any([timeoutController.signal, externalSignal])
    : timeoutController.signal;

  try {
    let response;
    try {
      response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
        signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);

      // Distinguish timeout from network failure
      if (
        fetchErr.name === 'AbortError' ||
        timeoutController.signal.aborted ||
        (externalSignal && externalSignal.aborted)
      ) {
        // If the external signal aborted it's a stale-request cancel — propagate
        if (externalSignal && externalSignal.aborted) {
          return { ok: false, errorKind: 'aborted', message: 'Request cancelled.' };
        }
        return {
          ok: false,
          errorKind: 'timeout',
          message:
            'The request timed out after 25 seconds. The server may be overloaded — please try again.',
        };
      }

      return {
        ok: false,
        errorKind: 'network',
        message:
          'Could not reach the server. Check that the backend is running and try again.',
      };
    }

    clearTimeout(timeoutId);

    // Parse the response body as JSON regardless of status (backend always sends JSON)
    let body;
    try {
      body = await response.json();
    } catch {
      return {
        ok: false,
        errorKind: 'parse',
        message: 'The server returned a response that could not be parsed.',
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        errorKind: 'server',
        message:
          body?.error ||
          `Server returned ${response.status} — please try again.`,
      };
    }

    if (!body?.data) {
      return {
        ok: false,
        errorKind: 'empty',
        message: 'The server returned an empty response.',
      };
    }

    return { ok: true, data: body.data };
  } catch (unexpectedErr) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      errorKind: 'network',
      message: `Unexpected error: ${unexpectedErr.message}`,
    };
  }
}
