---
name: haircut-booking
description: Book a haircut at Perfection Grooming (Toronto). Triggers on "book a haircut", "schedule haircut", "need a haircut", or mentions of Perfection Grooming appointments.
---

# Haircut Booking - Perfection Grooming

Book haircuts at Perfection Grooming (683 Mt Pleasant Rd, Toronto) via their Setmore booking system.

## Customer Details

- **Name:** Michael Smith
- **Email:** michael.lorne.smith@gmail.com
- **Phone:** 416-418-1297
- **Usual Service:** Haircut (45 min, $55)
- **Preferred Times:** Tuesday or Thursday afternoons

## Booking Workflow

### 1. Determine Target Date/Time

If user specifies a date → use that.
Otherwise → suggest next available Tuesday or Thursday afternoon.

### 2. Check Calendar Availability

Use the `gog` skill to check Mike's calendar:
```bash
gog calendar list --from "YYYY-MM-DD 12:00" --to "YYYY-MM-DD 18:00"
```

Haircut takes ~45 min + travel. Block 1.5 hours total. Confirm slot is free before proceeding.

### 3. Book via Setmore

Open the booking page in browser:
```
https://booking.setmore.com/scheduleappointment/0ef03ca0-dff0-4cfb-9418-627e1834eca7
```

Steps:
1. Click "Haircut" service link
2. Select the target date on calendar
3. Pick an afternoon time slot (12pm-5pm preferred)
4. Fill contact form:
   - Name: Michael Smith
   - Email: michael.lorne.smith@gmail.com
   - Phone: 416-418-1297
5. Confirm booking

### 4. Add Calendar Event

Always create a calendar event after booking confirmation:
```bash
gog calendar create primary \
  --summary "Haircut - Perfection Grooming" \
  --from "YYYY-MM-DDTHH:MM:00-05:00" \
  --to "YYYY-MM-DDTHH:MM:00-05:00" \
  --location "683 Mt Pleasant Rd, Toronto, ON M4S 2N2" \
  --description "Booking ID: XXXXXXXX\nService: Haircut (45 min) - \$55\nStylist: Ariam\nPhone: +1 647 896 6248"
```

Note: Setmore sends confirmation to Mike's personal email (michael.lorne.smith@gmail.com) — no access to verify, but booking confirmation page is sufficient.

## Services Reference

| Service | Duration | Price |
|---------|----------|-------|
| Haircut | 45 min | $55 |
| Beard Lineup | 30 min | $30 |
| Haircut + Beard | 1 hr | $75 |
| Hair & beard clean up | 30 min | $45 |
| Cleanup | 30 min | $30 |

## Salon Info

- **Address:** 683 Mt Pleasant Rd, Toronto, ON M4S 2N2
- **Phone:** +1 647 896 6248
- **Hours:** Mon-Fri 10am-6pm, Sat 9am-5pm
- **Stylist:** Ariam
