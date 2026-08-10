/**
 * Reusable Web3Forms result sender
 * =================================
 *
 * HOW TO USE THIS FILE IN FUTURE WORKSHEETS
 * ------------------------------------------
 * 1. Add this script before your worksheet's main JavaScript:
 *      <script src="./email-results.js"></script>
 *
 * 2. When the student finishes, call:
 *      await EmailResults.send({
 *        accessKey: "YOUR_WEB3FORMS_ACCESS_KEY",
 *        subject: "Worksheet results",
 *        studentLabel: "Optional student name or ID",
 *        worksheetTitle: "Your worksheet title",
 *        resultsText: "A readable text summary of scores and answers",
 *        metadata: {
 *          score: "8/10",
 *          duration: "07:42"
 *        }
 *      });
 *
 * 3. The access key determines which verified email address receives the form.
 *    Web3Forms access keys are intended to be used in client-side forms, so the
 *    key will be visible in the page source. Do not put unrelated secrets here.
 *
 * The function returns the parsed Web3Forms response. It throws an Error if the
 * request fails, making it easy for the worksheet UI to show a retry button.
 */

(function attachEmailResults(global) {
  "use strict";

  const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

  function safeString(value) {
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function metadataToText(metadata) {
    if (!metadata || typeof metadata !== "object") return "";

    return Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}: ${safeString(value)}`)
      .join("\n");
  }

  async function send({
    accessKey,
    subject = "Exercise results",
    studentLabel = "",
    worksheetTitle = "",
    resultsText = "",
    metadata = {}
  } = {}) {
    if (!accessKey) {
      throw new Error("Missing Web3Forms access key.");
    }

    const metadataText = metadataToText(metadata);
    const messageParts = [
      worksheetTitle ? `Worksheet: ${worksheetTitle}` : "",
      studentLabel ? `Student: ${studentLabel}` : "",
      metadataText,
      resultsText
    ].filter(Boolean);

    const payload = {
      access_key: accessKey,
      subject: safeString(subject),
      from_name: safeString(worksheetTitle || "Interactive Worksheet"),
      message: messageParts.join("\n\n"),
      botcheck: ""
    };

    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error("Web3Forms returned an unreadable response.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Web3Forms request failed (${response.status}).`);
    }

    return data;
  }

  global.EmailResults = Object.freeze({ send });
})(window);
