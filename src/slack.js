require('dotenv').config();

async function notifySlack(results) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const succeeded = results.filter((r) => r.status === '세팅 완료');
  const failed = results.filter((r) => r.status === '세팅 실패');

  if (results.length === 0) {
    await post(webhookUrl, { text: '✅ *Braze 캠페인 자동 세팅*\n처리 대상 캠페인이 없습니다.' });
    return;
  }

  const lines = [`*Braze 캠페인 자동 세팅 완료* — 총 ${results.length}개 (성공 ${succeeded.length} / 실패 ${failed.length})`];

  if (succeeded.length > 0) {
    lines.push('');
    lines.push('✅ 세팅 완료');
    for (const r of succeeded) {
      lines.push(`- <${r.brazeUrl}|${r.campaignName}>`);
      lines.push(`  세그먼트: ${r.segment} | 발송: ${r.sendDate} ${r.sendTime}`);
    }
  }

  if (failed.length > 0) {
    lines.push('');
    lines.push('❌ 세팅 실패');
    for (const r of failed) {
      lines.push(`- ${r.campaignName}`);
      lines.push(`  세그먼트: ${r.segment} | 발송: ${r.sendDate} ${r.sendTime}`);
      lines.push(`  사유: ${r.errorReason}`);
    }
  }

  await post(webhookUrl, { text: lines.join('\n') });
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('[slack] 전송 실패:', res.status, await res.text());
  }
}

module.exports = { notifySlack };
