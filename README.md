# Metal Arm

## Running emulated version

First make sure you have installed the expo ngrok package:

```
npm i -g @expo/ngrok
```

In the emulated version the bluetooth connection is not possible, so you need to run the mocked function. Whenever you see the `useBle` function in the code, you need to replace it with the `useBleExpoGo` function.

Then run the expo tunnel:

```
npx expo start --tunnel
```

You will see that a QR code is printed to the terminal. Check if that QR code is for the development build or the Expo Go app. Switch for the expo go app and scan the QR code with your phone. You should now be able to run the app on your phone.

## Running on device

To run on a device you need to install the development build on your phone.

In order to generate a build for your phone you have the eas cli tool installed.

```
npm install -g eas-cli
```

Then login to your expo account:

```
eas login
```

### Development build

Run the following command to generate a development build for your phone.

```
eas build --profile development --platform android
```

This command will take a while to complete.

The development build requires you to run the expo tunnel, as described above in the "Running emulated version" section.

### Preview build

Run the following command to generate a preview build for your phone.

```
eas build --profile preview --platform android
```

This command will take a while to complete.
