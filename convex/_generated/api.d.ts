/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAuth from "../adminAuth.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customDestinations from "../customDestinations.js";
import type * as groups from "../groups.js";
import type * as jobs from "../jobs.js";
import type * as kyc from "../kyc.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as planner from "../planner.js";
import type * as sessionAuth from "../sessionAuth.js";
import type * as status from "../status.js";
import type * as support from "../support.js";
import type * as trips from "../trips.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAuth: typeof adminAuth;
  auth: typeof auth;
  crons: typeof crons;
  customDestinations: typeof customDestinations;
  groups: typeof groups;
  jobs: typeof jobs;
  kyc: typeof kyc;
  notifications: typeof notifications;
  payments: typeof payments;
  planner: typeof planner;
  sessionAuth: typeof sessionAuth;
  status: typeof status;
  support: typeof support;
  trips: typeof trips;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
