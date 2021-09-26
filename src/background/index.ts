// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import { Callback, Message } from '@/shared/messages'

import { openInRightNextTab } from './tabs'

type MessageSender = chrome.runtime.MessageSender

chrome.runtime.onMessage.addListener(async (request: Message, _: MessageSender, sendResponse: Callback) => {
  if (request.type === "reloadRequest") {
    chrome.runtime.reload();
    sendResponse("reloaded");
  } else if (request.type === "openTabRequest" && request.payload) {
    openInRightNextTab(
      request.payload,
      () => sendResponse(`new tab opened with ${request.payload}`),
      { active: false }
    );
  }
});
