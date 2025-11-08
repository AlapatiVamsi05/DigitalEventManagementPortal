const nodemailer = require('nodemailer');

// Create a single, pooled transporter for reuse (faster than creating a new one per email)
const buildTransportOptions = () => {
    const opts = {
        pool: true,
        maxConnections: parseInt(process.env.EMAIL_MAX_CONNECTIONS, 10) || 5,
        maxMessages: parseInt(process.env.EMAIL_MAX_MESSAGES, 10) || 100,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    };

    // Prefer explicit SMTP host/port if provided (recommended on production)
    if (process.env.EMAIL_HOST) {
        opts.host = process.env.EMAIL_HOST;
        if (process.env.EMAIL_PORT) opts.port = parseInt(process.env.EMAIL_PORT, 10);
        opts.secure = process.env.EMAIL_SECURE === 'true';
    } else {
        // fallback to nodemailer service shorthand (e.g., 'gmail') if host isn't provided
        opts.service = process.env.EMAIL_SERVICE || 'gmail';
    }

    return opts;
};

const transporter = nodemailer.createTransport(buildTransportOptions());

// Helper: send promises in limited-size concurrent batches to avoid sequential waits
const sendInBatches = async (tasks, batchSize = 10) => {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize).map((t) => t());
        // wait for the batch to settle before continuing (prevents floods and respects rate limits)
        // collect settled results to allow counting successes/failures
        // eslint-disable-next-line no-await-in-loop
        const settled = await Promise.allSettled(batch);
        results.push(...settled);
    }
    return results;
};

// Generate confirmation token (simple approach)
const generateConfirmToken = (userId, action) => {
    return Buffer.from(`${userId}:${action}:${Date.now()}`).toString('base64');
};

// Send registration confirmation email
const sendRegistrationEmail = async (user) => {
    const declineToken = generateConfirmToken(user._id, 'register_decline');
    const declineUrl = `${process.env.BACKEND_URL}/api/email/decline-registration?token=${declineToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Welcome to Digital Event Management Portal',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to DEMP!</h2>
        <p>Hi ${user.username},</p>
        <p>Thank you for registering with Digital Event Management Portal. Your account has been created successfully!</p>
        <p><strong>Username:</strong> ${user.username}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>Joined:</strong> ${new Date().toLocaleDateString()}</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px;">If you did not create this account, please click the button below to request account deletion:</p>
          <a href="${declineUrl}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">No, Delete My Account</a>
        </div>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Registration email sent successfully to:', user.email);
    } catch (error) {
        console.error('❌ Error sending registration email to:', user.email);
        console.error('Error details:', error.message);
        if (error.response) {
            console.error('SMTP Response:', error.response);
        }
    }
};

// Send login notification email
const sendLoginEmail = async (user) => {
    const declineToken = generateConfirmToken(user._id, 'login_decline');
    const declineUrl = `${process.env.BACKEND_URL}/api/email/decline-login?token=${declineToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'New Login to Your DEMP Account',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Login Notification</h2>
        <p>Hi ${user.username},</p>
        <p>We detected a new login to your account:</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}<br>
        <strong>Account:</strong> ${user.email}</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
          <p style="margin: 0; font-size: 14px;">If this was not you, please click the button below to request account deletion for security:</p>
          <a href="${declineUrl}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px;">No, This Wasn't Me</a>
        </div>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Login email sent to:', user.email);
    } catch (error) {
        console.error('Error sending login email:', error);
    }
};

// Send event registration confirmation email
const sendEventRegistrationEmail = async (user, event, ticketId) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Registration Confirmed - ${event.title}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Event Registration Confirmed!</h2>
        <p>Hi ${user.username},</p>
        <p>You have successfully registered for the following event:</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
          <p><strong>Location:</strong> ${event.location}<br>
          <strong>Start:</strong> ${new Date(event.startDateTime).toLocaleString()}<br>
          <strong>End:</strong> ${new Date(event.endDateTime).toLocaleString()}<br>
          <strong>Your Ticket ID:</strong> ${ticketId}</p>
        </div>
        
        <p>Please keep this ticket ID safe. You will need it for check-in at the event.</p>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Event registration email sent to:', user.email);
    } catch (error) {
        console.error('Error sending event registration email:', error);
    }
};

// Send event reminder email
const sendEventReminderEmail = async (user, event, timeRemaining) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Reminder: ${event.title} - ${timeRemaining}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Event Reminder!</h2>
        <p>Hi ${user.username},</p>
        <p><strong>Your event is starting in ${timeRemaining}!</strong></p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #FF9800; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
          <p><strong>Location:</strong> ${event.location}<br>
          <strong>Start Time:</strong> ${new Date(event.startDateTime).toLocaleString()}<br>
          <strong>End Time:</strong> ${new Date(event.endDateTime).toLocaleString()}</p>
        </div>
        
        <p>Don't forget to bring your ticket ID for check-in!</p>
        <p>See you there!</p>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder email sent to ${user.email} for event: ${event.title}`);
    } catch (error) {
        console.error('Error sending reminder email:', error);
    }
};

// Send bulk reminder emails for a specific time interval
const sendBulkEventReminders = async (hoursBeforeEvent) => {
    try {
        const Event = require('../models/Event');
        const User = require('../models/User');

        const now = new Date();
        let events;

        // Handle live events (hoursBeforeEvent = 0)
        if (hoursBeforeEvent === 0) {
            // Find events that are currently happening
            events = await Event.find({
                isApproved: true,
                startDateTime: { $lte: now },
                endDateTime: { $gte: now }
            }).populate('participants.userId');
        } else {
            // Handle future events with time window
            const targetTime = new Date(now.getTime() + hoursBeforeEvent * 60 * 60 * 1000);
            const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);
            const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

            events = await Event.find({
                isApproved: true,
                startDateTime: {
                    $gte: windowStart,
                    $lte: windowEnd
                }
            }).populate('participants.userId');
        }

        let emailsSent = 0;

        const tasks = [];
        for (const event of events) {
            const timeLabel = hoursBeforeEvent === 0
                ? 'now - Event is Live!'
                : hoursBeforeEvent >= 1
                    ? `${hoursBeforeEvent} hour${hoursBeforeEvent > 1 ? 's' : ''}`
                    : `${hoursBeforeEvent * 60} minutes`;

            for (const participant of event.participants) {
                if (participant.userId && participant.userId.email) {
                    // push a task function that returns a promise when executed
                    tasks.push(() => sendEventReminderEmail(participant.userId, event, timeLabel));
                }
            }
        }

        const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 10;
        const results = await sendInBatches(tasks, batchSize);
        emailsSent = results.filter(r => r.status === 'fulfilled').length;

        const eventType = hoursBeforeEvent === 0 ? 'live events' : `events starting in ${hoursBeforeEvent} hours`;
        console.log(`Sent ${emailsSent} reminder emails for ${eventType}`);
        return emailsSent;
    } catch (error) {
        console.error('Error sending bulk reminders:', error);
        return 0;
    }
};

// Send event update notification to participants
const sendEventUpdateEmail = async (event, participants) => {
    const tasks = [];
    for (const participant of participants) {
        if (participant && participant.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: participant.email,
                subject: `Event Updated - ${event.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF9800;">Event Updated!</h2>
            <p>Hi ${participant.username},</p>
            <p>An event you're registered for has been updated:</p>
            
            <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #FF9800; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
              <p><strong>Location:</strong> ${event.location}<br>
              <strong>Start:</strong> ${new Date(event.startDateTime).toLocaleString()}<br>
              <strong>End:</strong> ${new Date(event.endDateTime).toLocaleString()}</p>
            </div>
            
            <p>Please review the updated details and mark your calendar accordingly.</p>
            
            <p>Best regards,<br>DEMP Team</p>
          </div>
        `
            };

            tasks.push(async () => {
                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Event update email sent to: ${participant.email}`);
                } catch (error) {
                    console.error('Error sending event update email to', participant.email, error?.message || error);
                }
            });
        }
    }

    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 10;
    await sendInBatches(tasks, batchSize);
};

// Send event deletion notification to participants
const sendEventDeletionEmail = async (event, participants) => {
    const tasks = [];
    for (const participant of participants) {
        if (participant && participant.email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: participant.email,
                subject: `Event Cancelled - ${event.title}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">Event Cancelled</h2>
            <p>Hi ${participant.username},</p>
            <p>We regret to inform you that the following event has been cancelled:</p>
            
            <div style="margin: 20px 0; padding: 20px; background-color: #ffebee; border-left: 4px solid #f44336; border-radius: 5px;">
              <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
              <p><strong>Was scheduled for:</strong> ${new Date(event.startDateTime).toLocaleString()}<br>
              <strong>Location:</strong> ${event.location}</p>
            </div>
            
            <p>We apologize for any inconvenience this may cause.</p>
            
            <p>Best regards,<br>DEMP Team</p>
          </div>
        `
            };

            tasks.push(async () => {
                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Event deletion email sent to: ${participant.email}`);
                } catch (error) {
                    console.error('Error sending event deletion email to', participant.email, error?.message || error);
                }
            });
        }
    }

    const batchSize = parseInt(process.env.EMAIL_BATCH_SIZE, 10) || 10;
    await sendInBatches(tasks, batchSize);
};

// Send event approval notification to host
const sendEventApprovalEmail = async (host, event) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: host.email,
        subject: `Event Approved - ${event.title}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Event Approved! 🎉</h2>
        <p>Hi ${host.username},</p>
        <p>Great news! Your event has been approved and is now visible to all users.</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #e8f5e9; border-left: 4px solid #4CAF50; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
          <p><strong>Location:</strong> ${event.location}<br>
          <strong>Start:</strong> ${new Date(event.startDateTime).toLocaleString()}<br>
          <strong>End:</strong> ${new Date(event.endDateTime).toLocaleString()}</p>
        </div>
        
        <p>Users can now register for your event. Good luck!</p>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Event approval email sent to:', host.email);
    } catch (error) {
        console.error('Error sending event approval email:', error);
    }
};

// Send event rejection notification to host
const sendEventRejectionEmail = async (host, event) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: host.email,
        subject: `Event Not Approved - ${event.title}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">Event Not Approved</h2>
        <p>Hi ${host.username},</p>
        <p>Your event submission has been reviewed and is not approved at this time.</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #FF9800; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">${event.title}</h3>
          <p><strong>Submitted for:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
        </div>
        
        <p>Please contact the administrators if you have questions or would like to submit a revised event.</p>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Event rejection email sent to:', host.email);
    } catch (error) {
        console.error('Error sending event rejection email:', error);
    }
};

// Send role change notification to user
const sendRoleChangeEmail = async (user, newRole, changedBy) => {

    const roleColors = {
        owner: '#f44336',
        admin: '#2196F3',
        organizer: '#00BCD4',
        user: '#9E9E9E'
    };

    const roleDescriptions = {
        owner: 'You now have full system access and control.',
        admin: 'You can now manage users, approve events, and access the admin dashboard.',
        organizer: 'You can now create events that are automatically approved.',
        user: 'You now have standard user access.'
    };

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Your Role Has Been Updated`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${roleColors[newRole]};">Your Role Has Been Updated</h2>
        <p>Hi ${user.username},</p>
        <p>Your account role has been changed by ${changedBy}.</p>
        
        <div style="margin: 20px 0; padding: 20px; background-color: #f5f5f5; border-left: 4px solid ${roleColors[newRole]}; border-radius: 5px;">
          <h3 style="margin-top: 0; color: #333;">New Role: ${newRole.toUpperCase()}</h3>
          <p>${roleDescriptions[newRole]}</p>
        </div>
        
        <p>Please log out and log back in for the changes to take full effect.</p>
        
        <p>Best regards,<br>DEMP Team</p>
      </div>
    `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Role change email sent to:', user.email);
    } catch (error) {
        console.error('Error sending role change email:', error);
    }
};

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
    sendRoleChangeEmail
};
