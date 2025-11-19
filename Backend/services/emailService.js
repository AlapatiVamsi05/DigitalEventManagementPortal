const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate confirmation token
const generateConfirmToken = (userId, action) => {
    return Buffer.from(`${userId}:${action}:${Date.now()}`).toString('base64');
};

// ---------------------
// GENERIC SEND HELPER
// ---------------------
async function sendEmail(to, subject, html) {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "DEMP <onboarding@resend.dev>",
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error(`Email error for ${to}:`, err.message);
        if (err.response) console.error("Resend responded:", err.response);
    }
}

// ---------------------
// 1. Registration Email
// ---------------------
const sendRegistrationEmail = async (user) => {
    const declineToken = generateConfirmToken(user._id, 'register_decline');
    const declineUrl = `${process.env.BACKEND_URL}/api/email/decline-registration?token=${declineToken}`;

    const html = `
    <div style="font-family: Arial; max-width: 600px;">
      <h2 style="color:#4CAF50;">Welcome to DEMP!</h2>
      <p>Hi ${user.username}, your account is created successfully.</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <a href="${declineUrl}" style="background:#f44336;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;">
        Delete my account
      </a>
    </div>
  `;

    await sendEmail(user.email, "Welcome to Digital Event Management Portal", html);
};

// ---------------------
// 2. Login Notification
// ---------------------
const sendLoginEmail = async (user) => {
    const declineToken = generateConfirmToken(user._id, 'login_decline');
    const declineUrl = `${process.env.BACKEND_URL}/api/email/decline-login?token=${declineToken}`;

    const html = `
    <div style="font-family: Arial; max-width:600px;">
      <h2 style="color:#2196F3;">New Login Detected</h2>
      <p>Your account was logged into at <strong>${new Date().toLocaleString()}</strong>.</p>
      <a href="${declineUrl}" style="background:#f44336;color:white;padding:10px 20px;border-radius:4px;text-decoration:none;">
        This wasn't me
      </a>
    </div>
  `;

    await sendEmail(user.email, "New Login to Your DEMP Account", html);
};

// ------------------------------------
// 3. Event Registration Confirmation
// ------------------------------------
const sendEventRegistrationEmail = async (user, event, ticketId) => {
    const html = `
    <div style="font-family: Arial; max-width:600px;">
      <h2 style="color:#4CAF50;">Event Registration Confirmed</h2>
      <p>Hello ${user.username}, you are registered for:</p>

      <div style="background:#f5f5f5;padding:20px;border-radius:5px;">
        <h3>${event.title}</h3>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Start:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
        <p><strong>End:</strong> ${new Date(event.endDateTime).toLocaleString()}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
      </div>
    </div>
  `;
    await sendEmail(user.email, `Registration Confirmed - ${event.title}`, html);
};

// ---------------------
// 4. Event Reminder
// ---------------------
const sendEventReminderEmail = async (user, event, timeRemaining) => {
    const html = `
    <div style="font-family: Arial;">
      <h2 style="color:#FF9800;">Event Reminder</h2>
      <p>Your event <strong>${event.title}</strong> starts in ${timeRemaining}.</p>

      <div style="background:#fff3cd;padding:20px;border-left:4px solid #FF9800;">
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Start:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
      </div>
    </div>
  `;
    await sendEmail(user.email, `Reminder: ${event.title}`, html);
};

// ----------------------------
// 5. Bulk Reminders
// ----------------------------
const sendBulkEventReminders = async (hoursBeforeEvent) => {
    try {
        const Event = require('../models/Event');

        const now = new Date();
        let events;

        if (hoursBeforeEvent === 0) {
            events = await Event.find({
                isApproved: true,
                startDateTime: { $lte: now },
                endDateTime: { $gte: now }
            }).populate('participants.userId');
        } else {
            const target = new Date(now.getTime() + hoursBeforeEvent * 60 * 60 * 1000);
            const windowStart = new Date(target.getTime() - 30 * 60 * 1000);
            const windowEnd = new Date(target.getTime() + 30 * 60 * 1000);

            events = await Event.find({
                isApproved: true,
                startDateTime: { $gte: windowStart, $lte: windowEnd }
            }).populate('participants.userId');
        }

        let count = 0;
        const timeLabel = hoursBeforeEvent === 0 ? 'now (Live!)'
            : hoursBeforeEvent + ' hours';

        for (const event of events) {
            for (const p of event.participants) {
                if (p.userId?.email) {
                    await sendEventReminderEmail(p.userId, event, timeLabel);
                    count++;
                }
            }
        }

        console.log(`Sent ${count} reminders for ${hoursBeforeEvent} hours`);
        return count;

    } catch (err) {
        console.error("Bulk reminder error:", err);
        return 0;
    }
};

// ----------------------------
// 6. Event Updated
// ----------------------------
const sendEventUpdateEmail = async (event, participants) => {
    for (const p of participants) {
        if (!p.email) continue;

        const html = `
      <div style="font-family: Arial;">
        <h2 style="color:#FF9800;">Event Updated</h2>
        <p>The event <strong>${event.title}</strong> has been updated.</p>
      </div>
    `;

        await sendEmail(p.email, `Event Updated - ${event.title}`, html);
    }
};

// ----------------------------
// 7. Event Deleted
// ----------------------------
const sendEventDeletionEmail = async (event, participants) => {
    for (const p of participants) {
        if (!p.email) continue;

        const html = `
      <div style="font-family: Arial;">
        <h2 style="color:#f44336;">Event Cancelled</h2>
        <p>Your event <strong>${event.title}</strong> has been cancelled.</p>
      </div>
    `;

        await sendEmail(p.email, `Event Cancelled - ${event.title}`, html);
    }
};

// ----------------------------
// 8. Event Approved
// ----------------------------
const sendEventApprovalEmail = async (host, event) => {
    const html = `
    <div style="font-family: Arial;">
      <h2 style="color:#4CAF50;">Event Approved!</h2>
      <p>Your event <strong>${event.title}</strong> is now live.</p>
    </div>
  `;
    await sendEmail(host.email, `Event Approved - ${event.title}`, html);
};

// ----------------------------
// 9. Event Rejected
// ----------------------------
const sendEventRejectionEmail = async (host, event) => {
    const html = `
    <div style="font-family: Arial;">
      <h2 style="color:#FF9800;">Event Not Approved</h2>
      <p>Your submitted event was not approved.</p>
    </div>
  `;
    await sendEmail(host.email, `Event Not Approved - ${event.title}`, html);
};

// ----------------------------
// 10. Role Change
// ----------------------------
const sendRoleChangeEmail = async (user, newRole, changedBy) => {
    const html = `
    <div style="font-family: Arial;">
      <h2>Role Updated</h2>
      <p>Your role has been changed to <strong>${newRole}</strong> by ${changedBy}.</p>
    </div>
  `;
    await sendEmail(user.email, `Your Role Has Been Updated`, html);
};

// EXPORT EVERYTHING
module.exports = {
    sendRegistrationEmail,
    sendLoginEmail,
    sendEventRegistrationEmail,
    sendEventReminderEmail,
    sendBulkEventReminders,
    sendEventUpdateEmail,
    sendEventDeletionEmail,
    sendEventApprovalEmail,
    sendEventRejectionEmail,
    sendRoleChangeEmail,
};
