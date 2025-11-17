[Skip to main content](https://developer.pdf.co/api/async-and-sync-mode/index.html#main-content)

Back to top

`Ctrl` + `K`

[Login](https://app.pdf.co/login) [Sign Up](https://app.pdf.co/signup) [**Dashboard**](https://app.pdf.co/)

**Your Credits**

[Add More](https://app.pdf.co/subscriptions)

# Understanding Sync and Async Modes [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#understanding-sync-and-async-modes 'Permalink to this heading')

When you use APIs, the mode you choose Synchronous (Sync) or Asynchronous (Async) can significantly affect both performance and cost. This article explains the differences between these modes, highlights why Async is superior, and shows how switching can benefit you.

## What are Sync and Async Modes? [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#what-are-sync-and-async-modes 'Permalink to this heading')

### Synchronous (Sync) Mode [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#synchronous-sync-mode 'Permalink to this heading')

In **Sync** mode, your API request is processed immediately, and the result is returned within a limit of 30 seconds. Here are a few disadvantages:

- **API Response**: You receive your results when the processing is complete.

- **No Job ID**: There’s no `jobId` provided by [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) for further status checks.

- **Time Limit**: If processing takes longer than 30 seconds, your request will fail.

- **Higher Costs**: Credits are calculated as:

```
Total Credits Used = Endpoint Credits × Number of Pages

```

Copy to clipboard

For precise credit calculations, please refer to the [Credits per Function](https://app.pdf.co/subscriptions#credits-calculator) page.

### Asynchronous (Async) Mode [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#asynchronous-async-mode 'Permalink to this heading')

**Async** mode processes your request in the background, providing the option to track progress which gives you:

- **Immediate API Response**: You receive a `jobId` and an output URL right away.

- **Background Processing**: Handles larger tasks without immediate timeouts.

- **Extended Time Limit**: Can process tasks for up to 45 minutes, reducing timeouts.

- **Status Checks**: Use the `jobId` to monitor progress via the [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) endpoint.

- **Webhook Support**: Supports callback to notify you when your job is done on a specified webhook URL.

- **Lower Cost**: Credits are calculated as:

```
Total Credits Used = Endpoint Credits + ("Job/Check" Credits × Number of "Job/Check" Calls until status is "working")

```

Copy to clipboard

For precise credit calculations, please refer to the [Credits per Function](https://app.pdf.co/subscriptions#credits-calculator) page.

## Why Async Mode is Superior [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#why-async-mode-is-superior 'Permalink to this heading')

1. **Handles Bigger Tasks Efficiently**: Designed for larger files or complex tasks that exceed Sync mode’s 30-second limit, reducing failures and saving time.

2. **More Cost-Effective**: Although Async mode includes a small cost for each [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) call (credits charged per check until status is “working”), it often results in overall savings by minimizing failed requests and unnecessary retries.

3. **Better Control and Transparency**: The `jobId` allows you to check your job’s status, giving you more control and clear insight into the process.

4. **Fewer Timeouts and Failures**: Extended time limits decrease the likelihood of failures.

5. **Automates Workflow with Webhooks**: [Webhooks](https://developer.pdf.co/api/webhooks/index.html#api-web-hooks) notify you automatically when your job is complete, reducing the need for manual checks and further saving on [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) credits.

## How to Switch to Async Mode [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#how-to-switch-to-async-mode 'Permalink to this heading')

1. **Modify Your API Request**:

   - Specify that you want to use Async mode in your API call, often by setting an `async` parameter to `true`.

2. **Receive the** `jobId` **and Output URL**:

   - After submitting your request, you’ll get a `jobId` and an output URL where results will be available once processing is complete.

3. **Implement Status Checks (Optional)**:

   - Use the [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) endpoint with your `jobId` to monitor progress.

   - Remember, each [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) call costs credits until status is “working”.

4. **Set Up Webhooks (Recommended)**:

   - Configure [Webhooks & Callbacks](https://developer.pdf.co/api/webhooks/index.html) to receive automatic notifications when your job is finished (costs 2 credits).

   - This reduces the need for manual status checks and saves on [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) credits.

## Conclusion [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#conclusion 'Permalink to this heading')

Async mode offers a superior approach for API interactions by providing efficiency, cost-effectiveness, and enhanced control. By switching from Sync to Async mode, you optimize resource usage and unlock features like webhooks and extended processing times.

## Addressing Common Concerns [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#addressing-common-concerns 'Permalink to this heading')

### What About the Cost of Multiple Status Checks? [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#what-about-the-cost-of-multiple-status-checks 'Permalink to this heading')

Async mode is designed to reduce the need for frequent status checks. By setting up [webhooks](https://developer.pdf.co/api/webhooks/index.html#api-web-hooks), you receive automatic updates when your job is complete, which minimizes the number of [job/check](https://developer.pdf.co/api/background-job-check/index.html#job-check) calls and optimizes credit usage.

### Is Switching to Async Mode Complicated? [\#](https://developer.pdf.co/api/async-and-sync-mode/index.html#is-switching-to-async-mode-complicated 'Permalink to this heading')

No, it’s straightforward. You handle the `jobId` and output URL provided after your initial request. Implementing [webhooks](https://developer.pdf.co/api/webhooks/index.html#api-web-hooks) can make the process even smoother by automating notifications.

Was this page helpful?
YesNo

### Are you a human?

What is 9 + 1?

Close

---

This website uses cookies for functional and analytical purposes. By continuing, you agree
to our cookie use. Please read our
[privacy policy](https://pdf.co/resources/legal/privacy)
for more information.

I Agree

On this page
