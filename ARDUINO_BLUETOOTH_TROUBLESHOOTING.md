# Arduino Bluetooth Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. **Bluetooth Module Not Appearing in Paired Devices**

**Possible Causes:**
- Module not in pairing mode
- Module not powered on
- Wrong Bluetooth mode (Classic vs BLE)

**Solutions:**
- **HC-05/HC-06**: Hold the small button on the module while powering it up to enter pairing mode
- **HC-05**: The LED should blink slowly (every 2 seconds) when in pairing mode
- **HC-06**: The LED should blink rapidly when in pairing mode
- Make sure you're using Bluetooth Classic, not Bluetooth Low Energy (BLE)

### 2. **Connection Fails After Pairing**

**Possible Causes:**
- Wrong baud rate
- Incorrect connection parameters
- Module not ready to accept connections

**Solutions:**
- **Check Baud Rate**: Most Arduino modules use 9600 baud by default
- **Arduino Code**: Make sure your Arduino code initializes Serial communication:
  ```cpp
  void setup() {
    Serial.begin(9600);  // Must match module baud rate
  }
  ```
- **Module Configuration**: Some modules need specific AT commands to configure

### 3. **Data Not Being Received by Arduino**

**Possible Causes:**
- Wrong line ending
- Data format issues
- Arduino not reading Serial data

**Solutions:**
- **Line Endings**: Arduino expects `\n` (newline) at the end of each command
- **Arduino Code**: Make sure you're reading Serial data:
  ```cpp
  void loop() {
    if (Serial.available()) {
      String data = Serial.readStringUntil('\n');
      // Process the data
      Serial.println("Received: " + data);  // Echo back for debugging
    }
  }
  ```

### 4. **Connection Drops Frequently**

**Possible Causes:**
- Power supply issues
- Interference
- Module overheating

**Solutions:**
- **Power Supply**: Use a stable 5V power supply, not USB power
- **Wiring**: Ensure proper connections (VCC, GND, TX, RX)
- **Distance**: Keep devices within 10 meters
- **Interference**: Avoid WiFi routers and other 2.4GHz devices

## Step-by-Step Debugging Process

### Step 1: Verify Hardware Setup
1. **Check Wiring**:
   - VCC → 5V (or 3.3V for some modules)
   - GND → GND
   - TX → RX (Arduino pin 0)
   - RX → TX (Arduino pin 1)

2. **Power Supply**: Use external power, not USB power

### Step 2: Test Module Pairing
1. Put module in pairing mode
2. Check if it appears in your phone's Bluetooth settings
3. Pair with default PIN (usually 1234 or 0000)

### Step 3: Test Basic Communication
1. Upload this test code to Arduino:
```cpp
void setup() {
  Serial.begin(9600);
  Serial.println("Arduino ready");
}

void loop() {
  if (Serial.available()) {
    String data = Serial.readStringUntil('\n');
    Serial.print("Received: ");
    Serial.println(data);
  }
  delay(100);
}
```

### Step 4: Check App Connection
1. Open the app and scan for devices
2. Look for your module in the paired devices list
3. Check the debug information in the app
4. Try connecting and check console logs

## Module-Specific Issues

### HC-05 Module
- **Default PIN**: 1234
- **Default Baud Rate**: 9600
- **Pairing Mode**: Hold button while powering up
- **LED Indicators**:
  - Slow blink (2s): Pairing mode
  - Fast blink: Searching for device
  - Solid: Connected

### HC-06 Module
- **Default PIN**: 1234
- **Default Baud Rate**: 9600
- **Pairing Mode**: Automatically enters pairing mode when not connected
- **LED Indicators**:
  - Fast blink: Pairing mode
  - Solid: Connected

## Testing Commands

Once connected, try these commands in your app:

1. **Basic Test**: Send "HELLO"
2. **Arduino Response**: Should receive "Received: HELLO"
3. **Status Check**: Send "STATUS"
4. **Reset Command**: Send "RESET"

## Common Error Messages and Solutions

| Error Message | Possible Cause | Solution |
|---------------|----------------|----------|
| "Connection failed" | Module not in pairing mode | Put module in pairing mode |
| "Device not found" | Module not paired | Pair device first in Bluetooth settings |
| "Connection timeout" | Wrong baud rate or module busy | Check baud rate, restart module |
| "Write failed" | Connection lost | Reconnect to device |
| "Permission denied" | App permissions | Grant Bluetooth permissions |

## Advanced Debugging

### Enable Detailed Logging
The app now includes detailed console logging. Check your development console for:
- Connection attempts
- Device information
- Error details
- Data transmission logs

### Test with Serial Monitor
1. Connect Arduino to computer via USB
2. Open Arduino IDE Serial Monitor
3. Set baud rate to 9600
4. Send test commands manually
5. Verify Arduino responds correctly

### Check Module Configuration
Some modules can be configured with AT commands:
```
AT+VERSION    // Check firmware version
AT+NAME       // Check device name
AT+PSWD       // Check pairing password
AT+UART       // Check baud rate settings
```

## Still Having Issues?

1. **Try a Different Module**: Some modules are defective
2. **Check Voltage Levels**: Ensure proper voltage levels (3.3V vs 5V)
3. **Update Firmware**: Some modules have firmware updates
4. **Contact Support**: Provide detailed error logs and hardware setup

## Quick Checklist

- [ ] Module is powered on
- [ ] Module is in pairing mode
- [ ] Device is paired in Bluetooth settings
- [ ] Arduino code initializes Serial at correct baud rate
- [ ] Arduino code reads Serial data
- [ ] App has Bluetooth permissions
- [ ] No interference from other devices
- [ ] Proper wiring connections
- [ ] Stable power supply
