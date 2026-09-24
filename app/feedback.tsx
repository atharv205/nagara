"use client";

import { useRef, useState, type FormEvent } from "react";
import { getPublicSupabaseClient } from "@/lib/supabase/public";

const priorities = [
  ["deadlines", "Deadlines & progress"],
  ["budgets", "Budgets & spending"],
  ["contractors", "Contractors & responsibility"],
  ["future_works", "Future road works"],
  ["more_roads", "More roads & neighbourhoods"],
  ["usability", "Easier navigation & Kannada content"],
] as const;

export default function Feedback({ projectCode, projectTitle }: { projectCode: string; projectTitle: string }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const busy = useRef(false);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  function showError(text: string) {
    setState("error");
    setMessage(text);
    window.requestAnimationFrame(() => statusRef.current?.focus());
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const review = String(values.get("review") ?? "").trim();
    const requestedAdditions = String(values.get("requested_additions") ?? "").trim();
    if (Math.max(review.length, requestedAdditions.length) < 5) {
      showError("Please write a few words in either your review or what we should add next.");
      return;
    }
    if (values.get("consent") !== "yes") {
      showError("Please agree to let Nagara save your feedback before sending.");
      return;
    }

    const client = getPublicSupabaseClient();
    if (!client) {
      showError("Feedback is temporarily unavailable. Your text is still here; please try again later.");
      return;
    }

    busy.current = true;
    setState("sending");
    setMessage("");
    try {
      const payload = {
        usefulness: Number(values.get("usefulness")),
        review,
        requested_additions: requestedAdditions,
        priorities: selectedPriorities,
        project_code: values.get("scope") === "project" ? projectCode : null,
        consent_version: "feedback_v1",
        website: String(values.get("website") ?? ""),
      };
      const fingerprint = JSON.stringify(payload);
      if (attempt.current?.fingerprint !== fingerprint) {
        attempt.current = { fingerprint, id: window.crypto.randomUUID() };
      }

      // Reuse this request ID on retry if the response was lost. Never request
      // returned rows: feedback is insert-only for public visitors.
      const { error } = await client.from("pilot_feedback")
        .insert({ ...payload, submission_id: attempt.current.id })
        .abortSignal(AbortSignal.timeout(15000));

      if (error && error.code !== "23505") throw error;
      setState("success");
      form.reset();
      setSelectedPriorities([]);
      window.requestAnimationFrame(() => statusRef.current?.focus());
    } catch {
      showError("We couldn’t confirm your feedback was saved. Your answers are still here—please try sending again.");
    } finally {
      busy.current = false;
    }
  }

  return (
    <section id="feedback" className="chapter feedback-chapter" aria-labelledby="feedback-title">
      <div className="chapter-label">06 — YOUR FEEDBACK · <span lang="kn">ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ</span></div>
      <div className="feedback-layout">
        <div className="feedback-intro">
          <p className="eyebrow">HELP SHAPE THE NEXT VERSION</p>
          <h2 id="feedback-title">What would make Nagara useful to you?</h2>
          <p className="feedback-kannada" lang="kn">ನಗರ ಹೇಗಿದೆ? ಇನ್ನೇನು ಬೇಕು ಅಂತ ಹೇಳಿ.</p>
          <p>This is our first Bannerghatta Road pilot. Tell us what helped, what was confusing, and what you wanted to find but couldn’t.</p>
          <p className="feedback-language">Write in English or Kannada.<br /><span lang="kn">ಕನ್ನಡ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಬರೆಯಿರಿ.</span></p>
          <div className="feedback-privacy" id="feedback-privacy">
            <strong>PRIVATE FEEDBACK, NOT A PUBLIC REVIEW</strong>
            <p>Your answers are saved in Nagara’s database for the team to review. They won’t appear on the public website. No login, name or email required. Please don’t include personal details.</p>
            <p>This form is for improving Nagara, not an official government complaint channel.</p>
          </div>
        </div>

        <div className="feedback-panel">
          {state === "success" ? (
            <div className="feedback-success" ref={statusRef} tabIndex={-1} role="status">
              <p className="eyebrow">FEEDBACK RECEIVED</p>
              <h3>Thank you for helping build Nagara.</h3>
              <p lang="kn">ನಿಮ್ಮ ಅಭಿಪ್ರಾಯಕ್ಕೆ ಧನ್ಯವಾದಗಳು.</p>
              <p>Your response has been saved. We’ll use the feedback to decide what to improve next.</p>
              <a href="#projects" className="feedback-back">BACK TO THE PROJECTS ↑</a>
            </div>
          ) : (
            <form onSubmit={submit} aria-describedby="feedback-privacy" aria-busy={state === "sending"}>
              <fieldset disabled={state === "sending"} className="feedback-fields">
                <legend className="sr-only">Your review of the Nagara pilot</legend>
                <fieldset className="feedback-rating">
                  <legend>01 / How useful was this pilot? <span>Required</span></legend>
                  <div className="feedback-rating-options">
                    {["Not useful", "A little useful", "Somewhat useful", "Useful", "Very useful"].map((label, index) => (
                      <label key={label}><input type="radio" name="usefulness" value={index + 1} required /><span><b>{index + 1}</b> {label}</span></label>
                    ))}
                  </div>
                </fieldset>

                <div className="feedback-field">
                  <label htmlFor="feedback-scope">02 / What is your feedback about?</label>
                  <select id="feedback-scope" name="scope" defaultValue="website">
                    <option value="website">Nagara as a whole</option>
                    <option value="project">This project: {projectTitle}</option>
                  </select>
                </div>

                <div className="feedback-field">
                  <label htmlFor="feedback-review">03 / What worked? What could be better?</label>
                  <textarea id="feedback-review" name="review" rows={4} maxLength={2000} placeholder="Was anything helpful, unclear or difficult to use?" aria-describedby="feedback-writing-hint" />
                </div>
                <div className="feedback-field">
                  <label htmlFor="feedback-additions">04 / What should we add next? <span lang="kn">ಇನ್ನೇನು ಬೇಕು?</span></label>
                  <textarea id="feedback-additions" name="requested_additions" rows={4} maxLength={2000} placeholder="A missing detail, a feature, or another road you want us to cover…" aria-describedby="feedback-writing-hint" />
                  <p id="feedback-writing-hint" className="feedback-hint">Answer either question above, or both. At least 5 characters in one answer; up to 2,000 per answer.</p>
                </div>

                <fieldset className="feedback-priorities">
                  <legend>05 / What matters most to you? <span>Optional · choose up to 3</span></legend>
                  <div>
                    {priorities.map(([value, label]) => (
                      <label key={value}>
                        <input type="checkbox" name="priorities" value={value} checked={selectedPriorities.includes(value)} disabled={!selectedPriorities.includes(value) && selectedPriorities.length >= 3} onChange={(event) => setSelectedPriorities((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="feedback-trap" aria-hidden="true">
                  <label htmlFor="feedback-website">Leave this field empty</label>
                  <input id="feedback-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>
                <label className="feedback-consent"><input type="checkbox" name="consent" value="yes" required /><span>I agree to Nagara saving and reviewing these answers to improve the pilot.</span></label>
                <button className="feedback-submit" type="submit">{state === "sending" ? "SAVING…" : "SEND FEEDBACK"} <span lang="kn">ಅಭಿಪ್ರಾಯ ಕಳುಹಿಸಿ</span> <span aria-hidden="true">→</span></button>
              </fieldset>
              <div ref={statusRef} tabIndex={-1} className="feedback-error" role="alert">{message}</div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
