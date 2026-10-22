/* OTP delivery. SMS_PROVIDER = console (default, development) | fast2sms | msg91 | twilio */
function createSms(env) {
  const provider = (env.SMS_PROVIDER || 'console').toLowerCase();
  return {
    provider,
    async send(mobile, otp) {
      if (provider === 'console') { console.log(`[sms:console] OTP for +91${mobile}: ${otp}`); return { dev: true }; }
      if (provider === 'fast2sms') {
        const r = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(env.SMS_API_KEY)}&route=otp&variables_values=${otp}&flash=0&numbers=${mobile}`, { signal: AbortSignal.timeout(10000) });
        if (!r.ok) throw new Error('fast2sms HTTP ' + r.status); return {};
      }
      if (provider === 'msg91') {
        const r = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(env.MSG91_TEMPLATE_ID)}&mobile=91${mobile}&authkey=${encodeURIComponent(env.SMS_API_KEY)}&otp=${otp}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) });
        if (!r.ok) throw new Error('msg91 HTTP ' + r.status); return {};
      }
      if (provider === 'twilio') {
        const body = new URLSearchParams({ To: '+91' + mobile, From: env.TWILIO_FROM, Body: `Your Kisan Setu OTP is ${otp}. Valid for 5 minutes. Do not share it.` });
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`, { method: 'POST', body, headers: { authorization: 'Basic ' + Buffer.from(env.TWILIO_SID + ':' + env.TWILIO_TOKEN).toString('base64') }, signal: AbortSignal.timeout(10000) });
        if (!r.ok) throw new Error('twilio HTTP ' + r.status); return {};
      }
      throw new Error('unknown SMS_PROVIDER ' + provider);
    },
  };
}
module.exports = { createSms };
