import csv
import random
import uuid
from datetime import datetime, timedelta

def generate_valid_gstin():
    # 2 digits state code, 10 chars pan, 1 digit entity, 1 char Z, 1 digit checksum
    # Simplify for demo: just need to match ^[0-9A-Z]{15}$
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    return "".join(random.choices(chars, k=15))

def generate_invalid_gstin():
    # Less than 15 chars or contains special chars
    if random.choice([True, False]):
        chars = "0123456789ABCDEF"
        return "".join(random.choices(chars, k=10)) # too short
    else:
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
        return "".join(random.choices(chars, k=15)) # invalid chars

def generate_csv(filename, num_rows=10000):
    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['irn', 'vendor_gstin', 'invoice_date', 'taxable_value'])
        
        start_date = datetime(2026, 1, 1)
        
        # Store some IRNs to duplicate them later
        past_irns = []
        
        for i in range(num_rows):
            is_anomaly = random.random() < 0.1 # 10% chance of anomaly
            
            if is_anomaly:
                anomaly_type = random.choice(['duplicate_irn', 'invalid_gstin'])
                
                if anomaly_type == 'duplicate_irn' and past_irns:
                    irn = random.choice(past_irns)
                    gstin = generate_valid_gstin()
                else:
                    irn = f"INV-{uuid.uuid4().hex[:8].upper()}"
                    gstin = generate_invalid_gstin()
                    past_irns.append(irn)
            else:
                irn = f"INV-{uuid.uuid4().hex[:8].upper()}"
                gstin = generate_valid_gstin()
                past_irns.append(irn)
                
            date_offset = random.randint(0, 100)
            invoice_date = (start_date + timedelta(days=date_offset)).strftime('%Y-%m-%d')
            taxable_value = round(random.uniform(100, 100000), 2)
            
            writer.writerow([irn, gstin, invoice_date, taxable_value])

if __name__ == '__main__':
    generate_csv('demo_10k_anomalies.csv', 10000)
    print("Successfully generated demo_10k_anomalies.csv")
