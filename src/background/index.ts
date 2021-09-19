// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

import { Callback, MessageType } from '../shared/messages'

chrome.runtime.onMessage.addListener((request: MessageType, _: any, sendResponse: Callback) => {
  if (request === "reloadRequest") {
    chrome.runtime.reload();
    sendResponse("reloaded");
  }
});