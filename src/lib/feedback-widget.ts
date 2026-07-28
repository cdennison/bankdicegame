import posthog from './posthog';

const STYLE = `
.ph-feedback-button {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 9999;
  background: #17233a;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  font: 600 14px system-ui, sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
}
.ph-feedback-panel {
  position: fixed;
  right: 20px;
  bottom: 76px;
  z-index: 9999;
  width: min(320px, calc(100vw - 40px));
  background: #fff;
  color: #17233a;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0,0,0,.3);
  padding: 16px;
  font: 14px/1.4 system-ui, sans-serif;
}
.ph-feedback-panel textarea {
  width: 100%;
  min-height: 90px;
  margin: 10px 0;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #d9e0ea;
  font: inherit;
  resize: vertical;
}
.ph-feedback-panel .ph-feedback-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.ph-feedback-panel button {
  font: 600 13px system-ui, sans-serif;
  border-radius: 8px;
  padding: 8px 12px;
  border: none;
  cursor: pointer;
}
.ph-feedback-cancel { background: transparent; color: #667085; }
.ph-feedback-submit { background: #2757d7; color: #fff; }
.ph-feedback-submit:disabled { opacity: .5; cursor: default; }
`;

export function mountFeedbackWidget(): void {
  if (document.querySelector('.ph-feedback-button')) return;

  const style = document.createElement('style');
  style.textContent = STYLE;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ph-feedback-button';
  button.textContent = 'Feedback';

  const panel = document.createElement('div');
  panel.className = 'ph-feedback-panel';
  panel.hidden = true;
  panel.innerHTML = `
    <strong>Got feedback?</strong>
    <textarea placeholder="What's working, what's not?" aria-label="Feedback message"></textarea>
    <div class="ph-feedback-actions">
      <button type="button" class="ph-feedback-cancel">Cancel</button>
      <button type="button" class="ph-feedback-submit">Send</button>
    </div>
  `;

  document.body.append(panel, button);

  const originalPanelHtml = panel.innerHTML;

  const resetPanel = () => {
    panel.innerHTML = originalPanelHtml;
    bindPanelHandlers();
  };

  const closePanel = () => {
    panel.hidden = true;
    resetPanel();
  };

  function bindPanelHandlers() {
    const textarea = panel.querySelector('textarea')!;
    const submitButton = panel.querySelector<HTMLButtonElement>('.ph-feedback-submit')!;
    const cancelButton = panel.querySelector<HTMLButtonElement>('.ph-feedback-cancel')!;

    cancelButton.addEventListener('click', closePanel);

    submitButton.addEventListener('click', () => {
      const message = textarea.value.trim();
      if (!message) return;

      posthog.capture('feedback_submitted', {
        message,
        page_url: window.location.href,
        page_path: window.location.pathname,
      });

      submitButton.disabled = true;
      panel.querySelector('strong')!.textContent = 'Thanks for the feedback!';
      textarea.hidden = true;
      panel.querySelector('.ph-feedback-actions')!.remove();

      setTimeout(closePanel, 1800);
    });
  }

  bindPanelHandlers();

  button.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) panel.querySelector('textarea')!.focus();
  });
}
