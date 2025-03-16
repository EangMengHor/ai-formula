# Extended Feature Standards

## Overview

This document provides guidelines on how to create an extended feature for the chat interface. The process involves the following steps:

1. [Add Feature Accessibility in Chat Input Component](#step-1-add-feature-accessibility-in-chat-input-component)
2. [Use `ExtendedFeatureNavBar` and Pass Expected Props](#step-2-use-extendedfeaturenavbar-and-pass-expected-props)
3. [Pass `validToShowMenu` Prop](#step-3-pass-validtoshowmenu-prop)
4. [Create a Configuration File](#step-4-create-a-configuration-file)

## Steps to Create an Extended Feature

### Step 1: Add Feature Accessibility in Chat Input Component

To allow users to redirect to the extended feature, modify the chat input component by adding a button or link that navigates to the extended feature page.

### Step 2: Use `ExtendedFeatureNavBar` and Pass Expected Props

Use the `ExtendedFeatureNavBar` component in your extended feature page and pass the necessary props to display the navigation bar.

### Step 3: Pass `validToShowMenu` Prop

In the extended feature page, ensure you pass the `validToShowMenu` prop to the `ExtendedFeatureNavBar` component. This prop should be an array of valid URLs where the "Back To Agentic Automation Dashboard" button should be shown.

### Step 4: Create a Configuration File

Create a new file named `config.js` in the directory of your new feature. This file will contain all the valid URLs where the "Back To Agentic Automation Dashboard" button should be shown. Import and use this configuration in your extended feature page.

## Conclusion

By following these steps, you can successfully create an extended feature for the chat interface, providing users with easy access and navigation.