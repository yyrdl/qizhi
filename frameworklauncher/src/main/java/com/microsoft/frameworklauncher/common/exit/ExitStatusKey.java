// Copyright (c) Microsoft Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
//
//
// Copyright (c) Peking University 2018
//
// The software is released under the Open-Intelligence Open Source License V1.0.
// The copyright owner promises to follow "Open-Intelligence Open Source Platform
// Management Regulation V1.0", which is provided by The New Generation of 
// Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

package com.microsoft.frameworklauncher.common.exit;

/**
 * ExitStatusKey is used as the exit code of all internal components.
 * It should be within range [0, 0], [170, 255] without conflicts with each others,
 * because Unix and its derivatives only support exit code in range [0, 255].
 */
public enum ExitStatusKey {
  SUCCEEDED(0),
  LAUNCHER_INTERNAL_TRANSIENT_ERROR(171),
  LAUNCHER_INTERNAL_NON_TRANSIENT_ERROR(172),
  LAUNCHER_INTERNAL_UNKNOWN_ERROR(173),
  LAUNCHER_REPORT_UNRETRIEVABLE(174),
  LAUNCHER_DIAGNOSTICS_UNRETRIEVABLE(175),
  LAUNCHER_DIAGNOSTICS_PARSE_ERROR(176),
  LAUNCHER_EXIT_STATUS_UNDEFINED(177),
  LAUNCHER_EXIT_STATUS_NOT_FOUND(178),
  LAUNCHER_SUBMIT_APP_TRANSIENT_ERROR(179),
  LAUNCHER_SUBMIT_APP_UNKNOWN_ERROR(180),
  LAUNCHER_SUBMIT_APP_NON_TRANSIENT_ERROR(181),
  LAUNCHER_STOP_FRAMEWORK_REQUESTED(214),
  AM_KILLED_BY_USER(182),
  AM_INTERNAL_TRANSIENT_ERROR(183),
  AM_INTERNAL_NON_TRANSIENT_ERROR(184),
  AM_INTERNAL_UNKNOWN_ERROR(185),
  AM_RM_RESYNC_LOST(186),
  AM_RM_RESYNC_EXCEED(187),
  CONTAINER_INVALID_EXIT_STATUS(188),
  CONTAINER_NOT_AVAILABLE_EXIT_STATUS(213),
  CONTAINER_ABORTED(189),
  CONTAINER_EXPIRED(190),
  CONTAINER_NODE_DISKS_FAILED(191),
  CONTAINER_PREEMPTED(192),
  CONTAINER_KILLED_BY_RM(193),
  CONTAINER_KILLED_BY_AM(194),
  CONTAINER_KILLED_AFTER_COMPLETED(195),
  CONTAINER_START_FAILED(196),
  CONTAINER_RM_RESYNC_LOST(197),
  CONTAINER_RM_RESYNC_EXCEED(198),
  CONTAINER_MIGRATE_TASK_REQUESTED(199),
  CONTAINER_PHYSICAL_MEMORY_EXCEEDED(200),
  CONTAINER_VIRTUAL_MEMORY_EXCEEDED(201),
  CONTAINER_EXTERNAL_UTILIZATION_SPIKED(202),
  CONTAINER_PORT_CONFLICT(203),
  CONTAINER_AGENT_EXPIRY(204),
  USER_APP_TRANSIENT_ERROR(205),
  USER_APP_NON_TRANSIENT_ERROR(206),
  USER_APP_FORCE_KILLED(207),
  USER_APP_TERMINATED(208),
  USER_APP_LOST(209),
  AGENT_INTERNAL_TRANSIENT_ERROR(210),
  AGENT_INTERNAL_NON_TRANSIENT_ERROR(211),
  AGENT_INTERNAL_UNKNOWN_ERROR(212);

  private final int key;

  ExitStatusKey(int value) {
    this.key = value;
  }

  public int toInt() {
    return key;
  }
}
