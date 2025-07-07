# Harry's Tix Testing Commands

## Login Commands
```bash
# Login as member
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"member@example.com","password":"password123"}' \
  -c member_cookies.txt

# Login as admin  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  -c admin_cookies.txt
```

## Pre-Order Testing
```bash
# Check member's weekly pre-order status
curl -X GET http://localhost:5000/api/pre-orders/weekly \
  -b member_cookies.txt

# View all pre-orders (admin)
curl -X GET http://localhost:5000/api/admin/pre-orders \
  -b admin_cookies.txt

# Approve a pre-order (admin)
curl -X PATCH http://localhost:5000/api/admin/pre-orders/PRE_ORDER_ID \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{"status":"approved"}'

# Process weekly pre-orders (admin)
curl -X POST http://localhost:5000/api/admin/process-weekly-preorders \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt
```

## Ticket Verification
```bash
# Check member's tickets
curl -X GET http://localhost:5000/api/tickets \
  -b member_cookies.txt

# View all events
curl -X GET http://localhost:5000/api/events
```

## Test Credit Cards (Stripe Test Mode)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995
- **Expired**: 4000 0000 0000 0069

Use any future expiry date and any 3-digit CVC.