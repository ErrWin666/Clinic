const DEFAULT_TEMPLATES_AR = {
  appointment_reminder: {
    text: "تذكير موعد: عزيزي {{patientName}}، لديك موعد في {{clinicName}} بتاريخ {{date}} الساعة {{time}}. نوع الموعد: {{appointmentType}}.",
    html: "🔔 <b>تذكير موعد</b>\n\nعزيزي {{patientName}}،\nلديك موعد في <b>{{clinicName}}</b>\n📅 التاريخ: {{date}}\n⏰ الوقت: {{time}}\n📋 النوع: {{appointmentType}}\n\nفي حال عدم القدرة على الحضور، يرجى التواصل معنا على {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_confirmation: {
    text: "تأكيد موعد: تم تأكيد موعدك في {{clinicName}} بتاريخ {{date}} الساعة {{time}}. نتطلع لرؤيتك.",
    html: "✅ <b>تأكيد موعد</b>\n\nعزيزي {{patientName}}،\nتم تأكيد موعدك في <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nنتطلع لرؤيتك.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_cancellation: {
    text: "إلغاء موعد: تم إلغاء موعدك في {{clinicName}} بتاريخ {{date}} الساعة {{time}}. للحجز مجدداً اتصل على {{clinicPhone}}.",
    html: "❌ <b>إلغاء موعد</b>\n\nعزيزي {{patientName}}،\nتم إلغاء موعدك في <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nللحجز مجدداً اتصل على {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_rescheduled: {
    text: "تعديل موعد: تم تعديل موعدك في {{clinicName}} إلى {{date}} الساعة {{time}}. للاستفسار اتصل على {{clinicPhone}}.",
    html: "🔄 <b>تعديل موعد</b>\n\nعزيزي {{patientName}}،\nتم تعديل موعدك في <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nللاستفسار اتصل على {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_missed: {
    text: "فاتك الموعد: عزيزي {{patientName}}، لقد فاتك موعدك في {{clinicName}} بتاريخ {{date}} الساعة {{time}}. يرجى التواصل معنا على {{clinicPhone}} لإعادة الحجز.",
    html: "⏰ <b>فاتك الموعد</b>\n\nعزيزي {{patientName}}،\nلقد فاتك موعدك في <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nيرجى التواصل معنا على {{clinicPhone}} لإعادة الحجز.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  overdue_invoice: {
    text: "تنبيه فاتورة: عزيزي {{patientName}}، فاتورتك رقم {{invoiceId}} في {{clinicName}} بقيمة {{amount}} {{currency}} متأخرة. يرجى السداد في أقرب وقت. للاستفسار: {{clinicPhone}}.",
    html: "📄 <b>تنبيه فاتورة متأخرة</b>\n\nعزيزي {{patientName}}،\nفاتورتك رقم <b>{{invoiceId}}</b> في <b>{{clinicName}}</b>\n💰 المبلغ: {{amount}} {{currency}}\n\nيرجى السداد في أقرب وقت.\nللاستفسار: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_due_soon: {
    text: "تذكير فاتورة: عزيزي {{patientName}}، فاتورتك رقم {{invoiceId}} في {{clinicName}} بقيمة {{amount}} {{currency}} تستحق السداد بتاريخ {{dueDate}}. يرجى السداد في الوقت المحدد. للاستفسار: {{clinicPhone}}.",
    html: "📄 <b>تذكير فاتورة قريبة الاستحقاق</b>\n\nعزيزي {{patientName}}،\nفاتورتك رقم <b>{{invoiceId}}</b> في <b>{{clinicName}}</b>\n💰 المبلغ: {{amount}} {{currency}}\n📅 تاريخ الاستحقاق: {{dueDate}}\n\nيرجى السداد في الوقت المحدد.\nللاستفسار: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_ready: {
    text: "فاتورة جاهزة: عزيزي {{patientName}}، فاتورتك رقم {{invoiceId}} في {{clinicName}} بقيمة {{amount}} {{currency}} جاهزة. شكراً لزيارتك.",
    html: "🧾 <b>فاتورة جاهزة</b>\n\nعزيزي {{patientName}}،\nفاتورتك رقم <b>{{invoiceId}}</b> في <b>{{clinicName}}</b>\n💰 المبلغ: {{amount}} {{currency}}\n\nشكراً لزيارتك.",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_paid: {
    text: "تم استلام الدفع: عزيزي {{patientName}}، تم تأكيد سداد فاتورتك رقم {{invoiceId}} في {{clinicName}} بقيمة {{amount}} {{currency}}. شكراً لك.",
    html: "✅ <b>تم استلام الدفع</b>\n\nعزيزي {{patientName}}،\nتم تأكيد سداد فاتورتك رقم <b>{{invoiceId}}</b> في <b>{{clinicName}}</b>\n💰 المبلغ: {{amount}} {{currency}}\n\nشكراً لك.",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  follow_up_due: {
    text: "تذكير متابعة: عزيزي {{patientName}}، حان موعد المتابعة في {{clinicName}}. آخر زيارة كانت في {{lastVisitDate}}. يرجى حجز موعد على {{clinicPhone}}.",
    html: "🏥 <b>تذكير متابعة</b>\n\nعزيزي {{patientName}}،\nحان موعد المتابعة في <b>{{clinicName}}</b>\n📅 آخر زيارة: {{lastVisitDate}}\n\nيرجى حجز موعد على {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{lastVisitDate}}"],
  },
  welcome: {
    text: "مرحباً بك: عزيزي {{patientName}}، أهلاً بك في {{clinicName}}. نتطلع لتقديم أفضل رعاية لك. للاستفسار: {{clinicPhone}}.",
    html: "👋 <b>مرحباً بك</b>\n\nعزيزي {{patientName}}،\nأهلاً بك في <b>{{clinicName}}</b> 🏥\nنتطلع لتقديم أفضل رعاية لك.\n\n📍 {{clinicAddress}}\n📞 {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  thank_you_visit: {
    text: "شكراً لزيارتك: عزيزي {{patientName}}، شكراً لزيارتك اليوم في {{clinicName}}. نتمنى لك دوام الصحة. للمتابعة أو الاستفسار: {{clinicPhone}}.",
    html: "🙏 <b>شكراً لزيارتك</b>\n\nعزيزي {{patientName}}،\nشكراً لزيارتك اليوم في <b>{{clinicName}}</b>.\nنتمنى لك دوام الصحة.\n\nللمتابعة أو الاستفسار: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  medication_reminder: {
    text: "تذكير دواء: عزيزي {{patientName}}، هذا تذكير بأخذ دوائك حسب وصفة {{clinicName}}. للاستفسار: {{clinicPhone}}.",
    html: "💊 <b>تذكير دواء</b>\n\nعزيزي {{patientName}}،\nهذا تذكير بأخذ دوائك حسب وصفة <b>{{clinicName}}</b>.\n\nللاستفسار: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  general: {
    text: "{{clinicName}}: {{message}}",
    html: "<b>{{clinicName}}</b>\n\n{{message}}",
    whatsappParams: [],
  },
};

const DEFAULT_TEMPLATES_EN = {
  appointment_reminder: {
    text: "Appointment Reminder: Dear {{patientName}}, you have an appointment at {{clinicName}} on {{date}} at {{time}}. Type: {{appointmentType}}.",
    html: "🔔 <b>Appointment Reminder</b>\n\nDear {{patientName}},\nYou have an appointment at <b>{{clinicName}}</b>\n📅 Date: {{date}}\n⏰ Time: {{time}}\n📋 Type: {{appointmentType}}\n\nIf you cannot attend, please contact us at {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_confirmation: {
    text: "Appointment Confirmed: Your appointment at {{clinicName}} on {{date}} at {{time}} has been confirmed. We look forward to seeing you.",
    html: "✅ <b>Appointment Confirmed</b>\n\nDear {{patientName}},\nYour appointment at <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nWe look forward to seeing you.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_cancellation: {
    text: "Appointment Cancelled: Your appointment at {{clinicName}} on {{date}} at {{time}} has been cancelled. To rebook call {{clinicPhone}}.",
    html: "❌ <b>Appointment Cancelled</b>\n\nDear {{patientName}},\nYour appointment at <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nTo rebook call {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_rescheduled: {
    text: "Appointment Rescheduled: Your appointment at {{clinicName}} has been moved to {{date}} at {{time}}. Inquiries: {{clinicPhone}}.",
    html: "🔄 <b>Appointment Rescheduled</b>\n\nDear {{patientName}},\nYour appointment at <b>{{clinicName}}</b> has been moved to\n📅 {{date}}\n⏰ {{time}}\n\nInquiries: {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  appointment_missed: {
    text: "Missed Appointment: Dear {{patientName}}, you missed your appointment at {{clinicName}} on {{date}} at {{time}}. Please contact us at {{clinicPhone}} to rebook.",
    html: "⏰ <b>Missed Appointment</b>\n\nDear {{patientName}},\nYou missed your appointment at <b>{{clinicName}}</b>\n📅 {{date}}\n⏰ {{time}}\n\nPlease contact us at {{clinicPhone}} to rebook.",
    whatsappParams: ["{{patientName}}", "{{date}}", "{{time}}"],
  },
  overdue_invoice: {
    text: "Invoice Overdue: Dear {{patientName}}, your invoice {{invoiceId}} at {{clinicName}} for {{amount}} {{currency}} is overdue. Please pay soon. Inquiries: {{clinicPhone}}.",
    html: "📄 <b>Invoice Overdue</b>\n\nDear {{patientName}},\nYour invoice <b>{{invoiceId}}</b> at <b>{{clinicName}}</b>\n💰 Amount: {{amount}} {{currency}}\n\nPlease pay at your earliest convenience.\nInquiries: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_due_soon: {
    text: "Invoice Due Soon: Dear {{patientName}}, your invoice {{invoiceId}} at {{clinicName}} for {{amount}} {{currency}} is due on {{dueDate}}. Please pay on time. Inquiries: {{clinicPhone}}.",
    html: "📄 <b>Invoice Due Soon</b>\n\nDear {{patientName}},\nYour invoice <b>{{invoiceId}}</b> at <b>{{clinicName}}</b>\n💰 Amount: {{amount}} {{currency}}\n📅 Due Date: {{dueDate}}\n\nPlease pay on time.\nInquiries: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_ready: {
    text: "Invoice Ready: Dear {{patientName}}, your invoice {{invoiceId}} at {{clinicName}} for {{amount}} {{currency}} is ready. Thank you for your visit.",
    html: "🧾 <b>Invoice Ready</b>\n\nDear {{patientName}},\nYour invoice <b>{{invoiceId}}</b> at <b>{{clinicName}}</b>\n💰 Amount: {{amount}} {{currency}}\n\nThank you for your visit.",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  invoice_paid: {
    text: "Payment Received: Dear {{patientName}}, your payment for invoice {{invoiceId}} at {{clinicName}} for {{amount}} {{currency}} has been confirmed. Thank you.",
    html: "✅ <b>Payment Received</b>\n\nDear {{patientName}},\nYour payment for invoice <b>{{invoiceId}}</b> at <b>{{clinicName}}</b>\n💰 Amount: {{amount}} {{currency}}\n\nhas been confirmed. Thank you.",
    whatsappParams: ["{{patientName}}", "{{invoiceId}}", "{{amount}}", "{{currency}}"],
  },
  follow_up_due: {
    text: "Follow-up Reminder: Dear {{patientName}}, your follow-up at {{clinicName}} is due. Last visit: {{lastVisitDate}}. Please book at {{clinicPhone}}.",
    html: "🏥 <b>Follow-up Reminder</b>\n\nDear {{patientName}},\nYour follow-up at <b>{{clinicName}}</b> is due.\n📅 Last visit: {{lastVisitDate}}\n\nPlease book at {{clinicPhone}}.",
    whatsappParams: ["{{patientName}}", "{{lastVisitDate}}"],
  },
  welcome: {
    text: "Welcome: Dear {{patientName}}, welcome to {{clinicName}}. We look forward to providing you with the best care. Inquiries: {{clinicPhone}}.",
    html: "👋 <b>Welcome</b>\n\nDear {{patientName}},\nWelcome to <b>{{clinicName}}</b> 🏥\nWe look forward to providing you with the best care.\n\n📍 {{clinicAddress}}\n📞 {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  thank_you_visit: {
    text: "Thank You: Dear {{patientName}}, thank you for visiting {{clinicName}} today. We wish you good health. For follow-up: {{clinicPhone}}.",
    html: "🙏 <b>Thank You</b>\n\nDear {{patientName}},\nThank you for visiting <b>{{clinicName}}</b> today.\nWe wish you good health.\n\nFor follow-up: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  medication_reminder: {
    text: "Medication Reminder: Dear {{patientName}}, this is a reminder to take your medication as prescribed by {{clinicName}}. Inquiries: {{clinicPhone}}.",
    html: "💊 <b>Medication Reminder</b>\n\nDear {{patientName}},\nThis is a reminder to take your medication as prescribed by <b>{{clinicName}}</b>.\n\nInquiries: {{clinicPhone}}",
    whatsappParams: ["{{patientName}}"],
  },
  general: {
    text: "{{clinicName}}: {{message}}",
    html: "<b>{{clinicName}}</b>\n\n{{message}}",
    whatsappParams: [],
  },
};

const WHATSAPP_CLOUD_TEMPLATES_AR = [
  {
    name: "appointment_reminder",
    language: "ar",
    category: "MARKETING",
    body: "تذكير موعد: عزيزي {{1}}، لديك موعد في {{2}} الساعة {{3}}. في حال عدم القدرة على الحضور يرجى التواصل معنا.",
    params: ["patientName", "date", "time"],
  },
  {
    name: "appointment_confirmation",
    language: "ar",
    category: "MARKETING",
    body: "تأكيد موعد: تم تأكيد موعدك بتاريخ {{1}} الساعة {{2}}. نتطلع لرؤيتك.",
    params: ["date", "time"],
  },
  {
    name: "appointment_cancellation",
    language: "ar",
    category: "MARKETING",
    body: "إلغاء موعد: تم إلغاء موعدك بتاريخ {{1}} الساعة {{2}}. للحجز مجدداً يرجى التواصل معنا.",
    params: ["date", "time"],
  },
  {
    name: "appointment_rescheduled",
    language: "ar",
    category: "MARKETING",
    body: "تعديل موعد: تم تعديل موعدك إلى {{1}} الساعة {{2}}. للاستفسار يرجى التواصل معنا.",
    params: ["date", "time"],
  },
  {
    name: "appointment_missed",
    language: "ar",
    category: "MARKETING",
    body: "فاتك الموعد: عزيزي {{1}}، لقد فاتك موعدك بتاريخ {{2}} الساعة {{3}}. يرجى التواصل معنا لإعادة الحجز.",
    params: ["patientName", "date", "time"],
  },
  {
    name: "invoice_notification",
    language: "ar",
    category: "MARKETING",
    body: "تنبيه فاتورة: عزيزي {{1}}، فاتورتك رقم {{2}} بقيمة {{3}} {{4}}. يرجى السداد في أقرب وقت.",
    params: ["patientName", "invoiceId", "amount", "currency"],
  },
  {
    name: "invoice_paid",
    language: "ar",
    category: "MARKETING",
    body: "تم استلام الدفع: عزيزي {{1}}، تم تأكيد سداد فاتورتك رقم {{2}} بقيمة {{3}} {{4}}. شكراً لك.",
    params: ["patientName", "invoiceId", "amount", "currency"],
  },
  {
    name: "follow_up_reminder",
    language: "ar",
    category: "MARKETING",
    body: "تذكير متابعة: عزيزي {{1}}، حان موعد المتابعة. آخر زيارة كانت في {{2}}. يرجى حجز موعد.",
    params: ["patientName", "lastVisitDate"],
  },
  {
    name: "welcome_message",
    language: "ar",
    category: "MARKETING",
    body: "مرحباً بك: عزيزي {{1}}، أهلاً بك في عيادتنا. نتطلع لتقديم أفضل رعاية لك.",
    params: ["patientName"],
  },
  {
    name: "thank_you_visit",
    language: "ar",
    category: "MARKETING",
    body: "شكراً لزيارتك: عزيزي {{1}}، شكراً لزيارتك اليوم. نتمنى لك دوام الصحة.",
    params: ["patientName"],
  },
];

const WHATSAPP_CLOUD_TEMPLATES_EN = [
  {
    name: "appointment_reminder",
    language: "en",
    category: "MARKETING",
    body: "Appointment Reminder: Dear {{1}}, you have an appointment on {{2}} at {{3}}. If you are unable to attend, please contact us.",
    params: ["patientName", "date", "time"],
  },
  {
    name: "appointment_confirmation",
    language: "en",
    category: "MARKETING",
    body: "Appointment Confirmed: Your appointment on {{1}} at {{2}} has been confirmed. We look forward to seeing you.",
    params: ["date", "time"],
  },
  {
    name: "appointment_cancellation",
    language: "en",
    category: "MARKETING",
    body: "Appointment Cancelled: Your appointment on {{1}} at {{2}} has been cancelled. To rebook, please contact us.",
    params: ["date", "time"],
  },
  {
    name: "appointment_rescheduled",
    language: "en",
    category: "MARKETING",
    body: "Appointment Rescheduled: Your appointment has been moved to {{1}} at {{2}}. For inquiries, please contact us.",
    params: ["date", "time"],
  },
  {
    name: "appointment_missed",
    language: "en",
    category: "MARKETING",
    body: "Missed Appointment: Dear {{1}}, you missed your appointment on {{2}} at {{3}}. Please contact us to rebook.",
    params: ["patientName", "date", "time"],
  },
  {
    name: "invoice_notification",
    language: "en",
    category: "MARKETING",
    body: "Invoice Alert: Dear {{1}}, your invoice #{{2}} for {{3}} {{4}} is ready. Please pay at your earliest convenience.",
    params: ["patientName", "invoiceId", "amount", "currency"],
  },
  {
    name: "invoice_paid",
    language: "en",
    category: "MARKETING",
    body: "Payment Received: Dear {{1}}, your payment for invoice #{{2}} for {{3}} {{4}} has been confirmed. Thank you.",
    params: ["patientName", "invoiceId", "amount", "currency"],
  },
  {
    name: "follow_up_reminder",
    language: "en",
    category: "MARKETING",
    body: "Follow-up Reminder: Dear {{1}}, your follow-up is due. Last visit: {{2}}. Please book an appointment.",
    params: ["patientName", "lastVisitDate"],
  },
  {
    name: "welcome_message",
    language: "en",
    category: "MARKETING",
    body: "Welcome: Dear {{1}}, welcome to our clinic. We look forward to providing you with the best care.",
    params: ["patientName"],
  },
  {
    name: "thank_you_visit",
    language: "en",
    category: "MARKETING",
    body: "Thank You: Dear {{1}}, thank you for visiting today. We wish you good health.",
    params: ["patientName"],
  },
];

module.exports = {
  DEFAULT_TEMPLATES_AR,
  DEFAULT_TEMPLATES_EN,
  WHATSAPP_CLOUD_TEMPLATES_AR,
  WHATSAPP_CLOUD_TEMPLATES_EN,
};
