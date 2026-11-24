import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerCopilot, answerCommunity, answerSiteManager, resetAgentBrainForTests } from '../src/ai/agentBrain.js';
import { normaliseCommunityAssistRequest, normaliseSiteManagerRequest, normaliseUserCopilotRequest } from '../src/ai/agentsContract.js';

test('copilot answers technical questions from the site library without a model key', () => {
  resetAgentBrainForTests();
  const parsed = normaliseUserCopilotRequest({ message: 'ما الفرق بين PAUT و TOFD؟', language: 'ar', history: [], mode: 'assistant' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.model, null);
  assert.equal(answer.kind, 'library');
  assert.ok(answer.citations.length > 0);
  assert.ok(answer.reasoningSteps.length >= 2);
  assert.match(answer.reply, /مكتبة INSCO/);
});

test('copilot refuses to invent technical answers below the existing confidence gate', () => {
  const parsed = normaliseUserCopilotRequest({ message: 'Explain ZZZQX 8847 technical acceptance procedure', language: 'en', history: [], mode: 'assistant' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.kind, 'decline');
  assert.equal(answer.citations.length, 0);
  assert.match(answer.reply, /will not guess/i);
});

test('follow-up questions carry the prior user topic into retrieval', () => {
  const parsed = normaliseUserCopilotRequest({
    message: 'وده معناه ايه؟', language: 'ar', mode: 'assistant',
    history: [{ role: 'user', content: 'ما الفرق بين PAUT و TOFD؟' }, { role: 'assistant', content: 'شرح مختصر' }],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.kind, 'library');
  assert.ok(answer.citations.length > 0);
});

test('social conversation is welcoming without pretending to have looked up facts', () => {
  const parsed = normaliseUserCopilotRequest({ message: 'السلام عليكم', language: 'ar', history: [], mode: 'assistant' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.model, null);
  assert.equal(answer.kind, 'rules');
  assert.equal(answer.citations.length, 0);
  assert.match(answer.reply, /أهلًا/);
});

test('copilot infers a drafting task from the conversation without a model call', () => {
  const parsed = normaliseUserCopilotRequest({ message: 'اكتب منشور عن PAUT في المجتمع', language: 'ar', history: [], mode: 'assistant' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.kind, 'editorial');
  assert.ok(answer.draftPost);
  assert.equal(answer.model, null);
});

test('method-selection requests collect missing context before recommending an NDT method', () => {
  const parsed = normaliseUserCopilotRequest({ message: 'اختارلي أنسب طريقة فحص', language: 'ar', history: [], mode: 'assistant' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCopilot(parsed.value);
  assert.equal(answer.kind, 'rules');
  assert.match(answer.reply, /السماكة/);
  assert.match(answer.reply, /الكود/);
  assert.equal(answer.citations.length, 0);
});

test('site manager bases health and actions on telemetry and exposes no model id', () => {
  const parsed = normaliseSiteManagerRequest({
    language: 'en', mode: 'executive_audit', instruction: '',
    telemetry: { totalRequests: 12, newRequests: 3, urgentRequests: 2, geofenceAlertCount: 1, totalCompanies: 4, activeTestingCompanies: 2, pendingAccounts: 1, communityPostsCount: 7, communityMembersCount: 9, opportunitiesCount: 0 },
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerSiteManager(parsed.value);
  assert.equal(answer.healthStatus, 'ACTION_REQUIRED');
  assert.equal(answer.model, null);
  assert.equal(answer.kind, 'site-data');
  assert.match(answer.summary, /12 requests total/);
  assert.ok(answer.priorityActions.some(action => action.actionType === 'open_requests'));
});

test('community code-check never certifies compliance and cites only a matched library source', () => {
  const parsed = normaliseCommunityAssistRequest({ action: 'code_check', language: 'en', ndtMethod: 'WELD', title: 'Acceptance criteria', body: 'Which acceptance criteria apply to this indication?' });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const answer = answerCommunity(parsed.value);
  assert.equal(answer.model, null);
  assert.ok(answer.kind === 'library' || answer.kind === 'decline');
  assert.doesNotMatch(answer.reply, /compliant|approved|certified/i);
  if (answer.kind === 'library') assert.ok(answer.citations.length > 0);
});
