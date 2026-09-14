'use client';

import React, { useEffect, useState } from 'react';

import {
  Activity,
  Ban,
  Building,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Key,
  Lock,
  LogOut,
  Mail,
  Radio,
  Server,
  Shield,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';


// ============================================================
// TYPES
// ============================================================

interface MetricLog {
  id: string;
  deviceFingerprint: string;
  status: string;
  revenue: number;
  timestamp: string;
}


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {

  // ==========================================================
  // AUTH CONTEXT
  // ==========================================================

  const {
    token,
    apiKey,
    companyName,
    login,
    logout,
    loading,
  } = useAuth();


  // ==========================================================
  // AUTHENTICATION STATE
  // ==========================================================

  const [isSignUp, setIsSignUp] =
    useState<boolean>(false);

  const [formCompany, setFormCompany] =
    useState<string>('');

  const [formEmail, setFormEmail] =
    useState<string>('');

  const [formPassword, setFormPassword] =
    useState<string>('');

  const [authError, setAuthError] =
    useState<string>('');

  const [authLoading, setAuthLoading] =
    useState<boolean>(false);


  // ==========================================================
  // SYSTEM ANALYTICS STATE
  // ==========================================================

  const [balanceMetricUnits, setBalanceMetricUnits] =
    useState<string>('500000');

  const [totalChecks, setTotalChecks] =
    useState<number>(0);

  const [liveLogs, setLiveLogs] =
    useState<MetricLog[]>([]);

  const [isConnected, setIsConnected] =
    useState<boolean>(false);

  const [bannedDevices, setBannedDevices] =
    useState<string[]>([]);

  const [socketInstance, setSocketInstance] =
    useState<WebSocket | null>(null);

  const [chartData, setChartData] =
    useState<number[]>(
      new Array(10).fill(10)
    );

  const [isBillingOpen, setIsBillingOpen] =
    useState<boolean>(false);

  const [billingLoading, setBillingLoading] =
    useState<boolean>(false);


  // ==========================================================
  // WEBSOCKET — REAL-TIME GRAVITY STREAM
  // ==========================================================

  useEffect(() => {

    if (!token) {
      return;
    }

    const socket = new WebSocket(
      'ws://localhost:8080/gravity-stream?dashboard=true'
    );

    setSocketInstance(socket);


    // --------------------------------------------------------
    // CONNECTION OPEN
    // --------------------------------------------------------

    socket.onopen = () => {

      console.log(
        'Gravity stream connected.'
      );

      setIsConnected(true);
    };


    // --------------------------------------------------------
    // MESSAGE RECEIVED
    // --------------------------------------------------------

    socket.onmessage = (event) => {

      try {

        const data = JSON.parse(
          event.data
        );


        if (data.status === 'SUCCESS') {

          // Update evaluation counter
          setTotalChecks(
            (previousCount) => {

              const nextCount =
                previousCount + 1;


              // Update graph
              setChartData(
                (currentData) => [

                  ...currentData.slice(1),

                  Math.min(
                    (nextCount * 6) % 100,
                    100
                  ),
                ]
              );


              return nextCount;
            }
          );


          // Update balance
          if (
            data.balanceMetricUnits !==
            undefined &&
            data.balanceMetricUnits !== null
          ) {

            setBalanceMetricUnits(
              String(
                data.balanceMetricUnits
              )
            );
          }


          // Create telemetry log
          const newLog: MetricLog = {

            id: Math.random()
              .toString(36)
              .substring(2, 9)
              .toUpperCase(),

            deviceFingerprint:
              data.deviceFingerprint ||
              `DEVICE_NODE_${Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase()}`,

            status:
              data.authenticated
                ? 'PASS'
                : 'FAIL',

            revenue: 0.00001,

            timestamp:
              new Date().toLocaleTimeString(),
          };


          // Add newest log to beginning
          setLiveLogs(
            (previousLogs) => [
              newLog,
              ...previousLogs.slice(0, 6),
            ]
          );
        }

      } catch (error) {

        console.error(
          'Gravity stream message parsing error:',
          error
        );
      }
    };


    // --------------------------------------------------------
    // WEBSOCKET ERROR
    // --------------------------------------------------------

    socket.onerror = (error) => {

      console.error(
        'Gravity stream WebSocket error:',
        error
      );

      setIsConnected(false);
    };


    // --------------------------------------------------------
    // CONNECTION CLOSED
    // --------------------------------------------------------

    socket.onclose = () => {

      console.log(
        'Gravity stream disconnected.'
      );

      setIsConnected(false);
      setSocketInstance(null);
    };


    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    return () => {

      socket.close();
    };

  }, [token]);


  // ==========================================================
  // AUTHENTICATION SUBMIT
  // ==========================================================

  const handleAuthSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();

    setAuthError('');
    setAuthLoading(true);


    const endpoint = isSignUp
      ? '/v1/auth/signup'
      : '/v1/auth/login';


    const payload = isSignUp

      ? {
          companyName: formCompany,
          email: formEmail,
          password: formPassword,
        }

      : {
          email: formEmail,
          password: formPassword,
        };


    try {

      const response = await fetch(
        `http://localhost:8080${endpoint}`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify(
            payload
          ),
        }
      );


      const data =
        await response.json();


      if (data.status === 'SUCCESS') {

        login(
          data.token,
          data.apiKey,
          data.companyName
        );


        if (
          data.balanceMetricUnits !==
          undefined
        ) {

          setBalanceMetricUnits(
            String(
              data.balanceMetricUnits
            )
          );
        }

      } else {

        setAuthError(
          data.message ||
            'Authentication checkpoint validation failed.'
        );
      }

    } catch (error) {

      console.error(
        'Authentication error:',
        error
      );

      setAuthError(
        'Cannot establish connection to the backend authentication service.'
      );

    } finally {

      setAuthLoading(false);
    }
  };


  // ==========================================================
  // BILLING — MOCK STRIPE WEBHOOK
  // ==========================================================

  const executePurchaseCheckout = async (
    amountCents: number
  ) => {

    if (!apiKey) {

      setAuthError(
        'API key unavailable. Please authenticate again.'
      );

      return;
    }


    setBillingLoading(true);


    try {

      const response = await fetch(
        'http://localhost:8080/v1/billing/webhook',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Stripe-Signature':
              't=123,v1=mock_signature_hash_data',
          },

          body: JSON.stringify({

            type:
              'checkout.session.completed',

            data: {

              object: {

                amount_total:
                  amountCents,

                metadata: {
                  apiKey,
                },

              },

            },

          }),

        }
      );


      if (!response.ok) {

        throw new Error(
          `Billing request failed: ${response.status}`
        );
      }


      const data =
        await response.json().catch(
          () => null
        );


      // If backend returns updated balance
      if (
        data?.balanceMetricUnits !==
        undefined
      ) {

        setBalanceMetricUnits(
          String(
            data.balanceMetricUnits
          )
        );

      } else {

        // Development fallback
        const currentBalance =
          Number(
            balanceMetricUnits || 0
          );

        let addedCapacity = 0;


        if (amountCents === 1000) {

          addedCapacity = 100000;

        } else if (
          amountCents === 5000
        ) {

          addedCapacity = 600000;

        } else if (
          amountCents === 10000
        ) {

          addedCapacity = 1500000;
        }


        setBalanceMetricUnits(
          String(
            currentBalance +
              addedCapacity
          )
        );
      }


      setIsBillingOpen(false);

    } catch (error) {

      console.error(
        'Payment synchronization error:',
        error
      );

    } finally {

      setBillingLoading(false);
    }
  };


  // ==========================================================
  // MANUAL DEVICE BAN
  // ==========================================================

  const triggerManualBan = (
    fingerprint: string
  ) => {

    if (
      !socketInstance ||
      !isConnected
    ) {

      return;
    }


    socketInstance.send(
      JSON.stringify({

        action:
          'MANUAL_BAN_OVERRIDE',

        deviceFingerprint:
          fingerprint,

      })
    );


    setBannedDevices(
      (previousDevices) => {

        if (
          previousDevices.includes(
            fingerprint
          )
        ) {

          return previousDevices;
        }


        return [
          ...previousDevices,
          fingerprint,
        ];
      }
    );


    setLiveLogs(
      (previousLogs) =>

        previousLogs.map(
          (log) =>

            log.deviceFingerprint ===
            fingerprint

              ? {
                  ...log,
                  status: 'BANNED',
                }

              : log
        )
    );
  };


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {

    return (

      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-500">

        BOOTING SYSTEM MATRIX CONSOLE...

      </div>
    );
  }


  // ==========================================================
  // AUTHENTICATION SCREEN
  // ==========================================================

  if (!token) {

    return (

      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">


          {/* TOP ACCENT */}

          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />


          {/* LOGO */}

          <div className="flex flex-col items-center mb-6">

            <Server className="text-emerald-400 h-10 w-10 mb-2" />

            <h2 className="text-xl font-bold tracking-tight text-slate-100">

              NEXORA GATEWAY

            </h2>

            <p className="text-xs text-slate-400 text-center mt-1">

              Multi-Tenant Credential Validation Terminal

            </p>

          </div>


          {/* AUTH FORM */}

          <form
            onSubmit={
              handleAuthSubmit
            }
            className="space-y-4"
          >


            {/* COMPANY */}

            {isSignUp && (

              <div>

                <label className="block text-xs font-medium text-slate-400 mb-1">

                  Company Name

                </label>


                <div className="relative">

                  <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />


                  <input
                    type="text"
                    required
                    value={
                      formCompany
                    }
                    onChange={(event) =>
                      setFormCompany(
                        event.target.value
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Global Corp Ltd"
                  />

                </div>

              </div>
            )}


            {/* EMAIL */}

            <div>

              <label className="block text-xs font-medium text-slate-400 mb-1">

                Enterprise Email

              </label>


              <div className="relative">

                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />


                <input
                  type="email"
                  required
                  value={
                    formEmail
                  }
                  onChange={(event) =>
                    setFormEmail(
                      event.target.value
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="admin@enterprise.com"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div>

              <label className="block text-xs font-medium text-slate-400 mb-1">

                Password Credentials

              </label>


              <div className="relative">

                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />


                <input
                  type="password"
                  required
                  value={
                    formPassword
                  }
                  onChange={(event) =>
                    setFormPassword(
                      event.target.value
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••••••"
                />

              </div>

            </div>


            {/* ERROR */}

            {authError && (

              <div className="text-xs bg-rose-950/40 text-rose-400 border border-rose-900 px-3 py-2 rounded-lg font-mono">

                {authError}

              </div>

            )}


            {/* SUBMIT */}

            <button
              type="submit"
              disabled={
                authLoading
              }
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-medium py-2 rounded-lg hover:from-emerald-500 hover:to-teal-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >

              {authLoading

                ? 'Establishing Secure Session...'

                : isSignUp

                ? 'Generate Platform Account'

                : 'Authenticate Security Session'}

            </button>

          </form>


          {/* SWITCH MODE */}

          <div className="mt-6 text-center">

            <button
              type="button"
              onClick={() => {

                setIsSignUp(
                  !isSignUp
                );

                setAuthError('');

              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
            >

              {isSignUp

                ? 'Already mapped? Access telemetry terminal'

                : 'Need global node credentials? Provision tenancy'}

            </button>

          </div>

        </div>

      </main>
    );
  }


  // ==========================================================
  // LOGGED-IN DASHBOARD
  // ==========================================================

  return (

    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">


      {/* ======================================================
          GLOBAL HEADER
      ====================================================== */}

      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur px-6 py-4">

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">


          {/* COMPANY */}

          <div className="flex items-center space-x-3 min-w-0">

            <div className="h-2 w-2 rounded-full animate-pulse bg-emerald-500 shrink-0" />

            <h1 className="text-sm font-bold tracking-wider font-mono text-slate-200 truncate">

              {companyName?.toUpperCase() ||
                'NEXORA'}

              {' // GRAVITY_UI'}

            </h1>

          </div>


          {/* HEADER ACTIONS */}

          <div className="flex items-center gap-3 shrink-0">


            {/* API KEY */}

            <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono">

              <Key className="h-3 w-3 text-amber-500" />

              <span className="text-slate-500">
                KEY:
              </span>

              <span className="text-slate-300 select-all">

                {apiKey
                  ? `${apiKey.substring(
                      0,
                      8
                    )}...`
                  : 'NONE'}

              </span>

            </div>


            {/* BUY CREDIT */}

            <button
              type="button"
              onClick={() =>
                setIsBillingOpen(
                  !isBillingOpen
                )
              }
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white border border-emerald-700 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer text-xs font-semibold shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:from-emerald-500 hover:to-teal-400"
            >

              <CreditCard className="h-4 w-4" />

              <span className="hidden sm:inline">
                Buy Credit Capacity
              </span>

              <span className="sm:hidden">
                Buy
              </span>

            </button>


            {/* STREAM STATUS */}

            <div className="hidden md:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg">

              <Radio
                className={`h-4 w-4 ${
                  isConnected
                    ? 'text-emerald-500 animate-pulse'
                    : 'text-rose-500'
                }`}
              />

              <span
                className={`text-xs font-mono ${
                  isConnected
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >

                {isConnected
                  ? 'MESH STREAM ACTIVE'
                  : 'GRID CONNECTING'}

              </span>

            </div>


            {/* LOGOUT */}

            <button
              type="button"
              onClick={() =>
                logout()
              }
              className="inline-flex items-center gap-2 bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-900 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer text-xs"
              title="Logout"
            >

              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline">
                Logout
              </span>

            </button>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN WORKSPACE
      ====================================================== */}

      <main className="flex-1 p-4 md:p-6">

        <div className="max-w-7xl mx-auto space-y-6">


          {/* ==================================================
              STATS ANALYTICS BANNER GRID
          ================================================== */}

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">


            {/* TELEMETRY LINK */}

            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500 uppercase tracking-wider">

                    Telemetry Link

                  </p>

                  <p
                    className={`text-sm font-bold font-mono mt-2 ${
                      isConnected
                        ? 'text-emerald-400'
                        : 'text-rose-500'
                    }`}
                  >

                    {isConnected
                      ? 'ONLINE_STREAM'
                      : 'DISCONNECTED'}

                  </p>

                </div>


                <Radio
                  className={`h-8 w-8 ${
                    isConnected
                      ? 'text-emerald-500 animate-pulse'
                      : 'text-slate-700'
                  }`}
                />

              </div>

            </div>


            {/* AVAILABLE CAPACITY */}

            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500 uppercase tracking-wider">

                    Available Metric Weight

                  </p>

                  <p className="text-xl font-bold font-mono mt-2 text-slate-100">

                    {Number(
                      balanceMetricUnits ||
                        0
                    ).toLocaleString()}

                  </p>

                </div>


                <Activity className="h-8 w-8 text-teal-500" />

              </div>

            </div>


            {/* TOTAL CHECKS */}

            <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-slate-500 uppercase tracking-wider">

                    Total Evaluated Checks

                  </p>

                  <p className="text-xl font-bold font-mono mt-2 text-slate-100">

                    {totalChecks.toLocaleString()}

                  </p>

                </div>


                <Shield className="h-8 w-8 text-emerald-500" />

              </div>

            </div>


            {/* BILLING */}

            <button
              type="button"
              onClick={() =>
                setIsBillingOpen(
                  true
                )
              }
              className="bg-slate-900 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between text-left cursor-pointer hover:border-emerald-800 transition-colors"
            >

              <div>

                <p className="text-xs text-slate-500 uppercase tracking-wider">

                  Account Billing Status

                </p>

                <p className="text-sm font-bold font-mono mt-2 text-emerald-400">

                  ADD CAPACITY

                </p>

              </div>


              <CreditCard className="h-8 w-8 text-amber-500" />

            </button>

          </section>


          {/* ==================================================
              MIDDLE LAYER
          ================================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">


            {/* =================================================
                GRAPH
            ================================================= */}

            <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h2 className="font-bold text-slate-100">

                    Ingested Vector Velocity

                  </h2>

                  <p className="text-xs text-slate-500 mt-1">

                    Continuous evaluation request frequency distribution matrix.

                  </p>

                </div>


                <Activity className="h-5 w-5 text-emerald-500" />

              </div>


              {/* CHART */}

              <div className="h-56 flex items-end gap-2 border-b border-slate-800 pb-2">

                {chartData.map(
                  (value, index) => (

                    <div
                      key={index}
                      className="flex-1 h-full flex items-end group"
                    >

                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{
                          height: `${Math.max(
                            value,
                            8
                          )}%`,
                        }}
                        title={`${value}%`}
                      />

                    </div>

                  )
                )}

              </div>


              {/* CHART LABELS */}

              <div className="flex justify-between mt-3 text-[10px] font-mono text-slate-600">

                <span>
                  T-10 SECONDS
                </span>

                <span>
                  BUFFER STREAM ACTIVE
                </span>

                <span>
                  REAL-TIME NOW
                </span>

              </div>

            </div>


            {/* =================================================
                POLICY BLACKLIST
            ================================================= */}

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <h2 className="font-bold text-slate-100">

                    Active Policy Blacklist

                  </h2>

                  <p className="text-xs text-slate-500 mt-1">

                    Manual mitigation rules

                  </p>

                </div>


                <Ban className="h-5 w-5 text-rose-500" />

              </div>


              {bannedDevices.length === 0 ? (

                <div className="h-40 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-lg px-5">

                  <CheckCircle2 className="h-7 w-7 text-slate-700 mb-3" />

                  <p className="text-xs text-slate-600">

                    Zero explicit override rules deployed inside target cluster.

                  </p>

                </div>

              ) : (

                <div className="space-y-2 max-h-52 overflow-y-auto">

                  {bannedDevices.map(
                    (fingerprint) => (

                      <div
                        key={fingerprint}
                        className="flex items-center justify-between bg-slate-950 border border-rose-950/50 px-3 py-3 rounded-lg"
                      >

                        <div className="min-w-0">

                          <p className="text-xs font-mono text-slate-300 truncate">

                            {fingerprint}

                          </p>

                          <p className="text-[10px] text-rose-500 font-mono mt-1">

                            MANUAL_BAN

                          </p>

                        </div>


                        <Ban className="h-4 w-4 text-rose-500 shrink-0 ml-3" />

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>


          {/* ==================================================
              REAL-TIME INGESTION TABLE
          ================================================== */}

          <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">


            {/* TABLE HEADER */}

            <div className="p-6 border-b border-slate-800">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="font-bold text-slate-100">

                    Live Processing Audit Ingestion Stream

                  </h2>

                  <p className="text-xs text-slate-500 mt-1">

                    Asynchronous ingress checking blocks currently processing through backend pipeline segments.

                  </p>

                </div>


                <div className="hidden sm:flex items-center gap-2 text-xs font-mono">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-rose-500'
                    }`}
                  />

                  <span className="text-slate-500">

                    {isConnected
                      ? 'STREAM_ACTIVE'
                      : 'STREAM_OFFLINE'}

                  </span>

                </div>

              </div>

            </div>


            {/* TABLE */}

            <div className="overflow-x-auto">

              <table className="w-full text-left">


                {/* TABLE HEAD */}

                <thead className="bg-slate-950/70">

                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">

                    <th className="px-6 py-4 whitespace-nowrap">
                      Verification ID
                    </th>

                    <th className="px-6 py-4 whitespace-nowrap">
                      Node Fingerprint
                    </th>

                    <th className="px-6 py-4 whitespace-nowrap">
                      Evaluation Status
                    </th>

                    <th className="px-6 py-4 whitespace-nowrap">
                      Weight Toll
                    </th>

                    <th className="px-6 py-4 whitespace-nowrap">
                      Ingress Timestamp
                    </th>

                    <th className="px-6 py-4 whitespace-nowrap">
                      Cluster Override Action
                    </th>

                  </tr>

                </thead>


                {/* TABLE BODY */}

                <tbody className="divide-y divide-slate-800">


                  {/* EMPTY STATE */}

                  {liveLogs.length === 0 ? (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center"
                      >

                        <Radio className="h-8 w-8 text-slate-700 mx-auto mb-3" />

                        <p className="text-xs font-mono text-slate-600">

                          Awaiting remote signal handshake...

                        </p>

                        <p className="text-[10px] text-slate-700 mt-1">

                          Launch active client testing to view live mutations.

                        </p>

                      </td>

                    </tr>

                  ) : (


                    /* LOG ROWS */

                    liveLogs.map(
                      (log) => (

                        <tr
                          key={log.id}
                          className="hover:bg-slate-950/50 transition-colors"
                        >


                          {/* ID */}

                          <td className="px-6 py-4">

                            <span className="font-mono text-xs text-slate-300">

                              {log.id}

                            </span>

                          </td>


                          {/* FINGERPRINT */}

                          <td className="px-6 py-4">

                            <span className="font-mono text-xs text-slate-400">

                              {log.deviceFingerprint}

                            </span>

                          </td>


                          {/* STATUS */}

                          <td className="px-6 py-4">

                            <span
                              className={`inline-flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono border ${
                                log.status ===
                                'PASS'

                                  ? 'text-emerald-400 border-emerald-900 bg-emerald-950/30'

                                  : log.status ===
                                    'BANNED'

                                  ? 'text-rose-400 border-rose-900 bg-rose-950/30'

                                  : 'text-amber-400 border-amber-900 bg-amber-950/30'
                              }`}
                            >

                              <span className="h-1.5 w-1.5 rounded-full bg-current" />

                              {log.status}

                            </span>

                          </td>


                          {/* REVENUE */}

                          <td className="px-6 py-4">

                            <span className="font-mono text-xs text-slate-400">

                              {log.revenue.toFixed(
                                5
                              )}{' '}
                              units

                            </span>

                          </td>


                          {/* TIMESTAMP */}

                          <td className="px-6 py-4">

                            <span className="font-mono text-xs text-slate-500">

                              {log.timestamp}

                            </span>

                          </td>


                          {/* ACTION */}

                          <td className="px-6 py-4">

                            {log.status !==
                            'BANNED' ? (

                              <button
                                type="button"
                                onClick={() =>
                                  triggerManualBan(
                                    log.deviceFingerprint
                                  )
                                }
                                disabled={
                                  !isConnected
                                }
                                className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >

                                <Ban className="h-3.5 w-3.5" />

                                MANUAL_BAN

                              </button>

                            ) : (

                              <span className="text-[10px] font-mono text-rose-500">

                                OVERRIDE_ACTIVE

                              </span>

                            )}

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>

      </main>


      {/* ======================================================
          BILLING OVERLAY
      ====================================================== */}

      {isBillingOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">


          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close billing overlay"
            onClick={() =>
              setIsBillingOpen(
                false
              )
            }
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
          />


          {/* BILLING MODAL */}

          <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">


            {/* MODAL HEADER */}

            <div className="flex items-start justify-between p-6 border-b border-slate-800">

              <div>

                <div className="flex items-center gap-2">

                  <CreditCard className="h-5 w-5 text-emerald-500" />

                  <h2 className="text-lg font-bold text-slate-100">

                    CREDIT CAPACITY

                  </h2>

                </div>

                <p className="text-xs text-slate-500 mt-2">

                  Increase the available validation capacity for your organization.

                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setIsBillingOpen(
                    false
                  )
                }
                className="text-slate-500 hover:text-slate-200 transition-colors"
                title="Close"
              >

                <X className="h-5 w-5" />

              </button>

            </div>


            {/* MODAL CONTENT */}

            <div className="p-6">


              {/* CURRENT BALANCE */}

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono">

                      Current Capacity

                    </p>

                    <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">

                      {Number(
                        balanceMetricUnits ||
                          0
                      ).toLocaleString()}

                    </p>

                  </div>


                  <Activity className="h-7 w-7 text-emerald-600" />

                </div>

              </div>


              {/* PRICING */}

              <div className="space-y-3">


                {/* TIER A */}

                <button
                  type="button"
                  disabled={
                    billingLoading
                  }
                  onClick={() =>
                    executePurchaseCheckout(
                      1000
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-700 hover:bg-slate-900 p-4 rounded-xl flex items-center justify-between text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  <div>

                    <p className="text-sm font-semibold text-slate-200">

                      Tier A — Core Allocation

                    </p>

                    <p className="text-xs text-slate-500 mt-1">

                      +100,000 validation resource blocks

                    </p>

                  </div>


                  <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">

                    <DollarSign className="h-4 w-4" />

                    10.00

                  </div>

                </button>


                {/* TIER B */}

                <button
                  type="button"
                  disabled={
                    billingLoading
                  }
                  onClick={() =>
                    executePurchaseCheckout(
                      5000
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-700 hover:bg-slate-900 p-4 rounded-xl flex items-center justify-between text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  <div>

                    <p className="text-sm font-semibold text-slate-200">

                      Tier B — Supercluster Payload

                    </p>

                    <p className="text-xs text-slate-500 mt-1">

                      +600,000 validation resource blocks

                    </p>

                  </div>


                  <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">

                    <DollarSign className="h-4 w-4" />

                    50.00

                  </div>

                </button>


                {/* TIER C */}

                <button
                  type="button"
                  disabled={
                    billingLoading
                  }
                  onClick={() =>
                    executePurchaseCheckout(
                      10000
                    )
                  }
                  className="w-full bg-slate-950 border border-emerald-900/60 hover:border-emerald-600 hover:bg-slate-900 p-4 rounded-xl flex items-center justify-between text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >

                  <div>

                    <div className="flex items-center gap-2 flex-wrap">

                      <p className="text-sm font-semibold text-slate-200">

                        Tier C — Enterprise Capacity

                      </p>


                      <span className="text-[9px] uppercase font-mono bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded">

                        Recommended

                      </span>

                    </div>


                    <p className="text-xs text-slate-500 mt-1">

                      +1,500,000 validation resource blocks

                    </p>

                  </div>


                  <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">

                    <DollarSign className="h-4 w-4" />

                    100.00

                  </div>

                </button>

              </div>


              {/* BILLING LOADING */}

              {billingLoading && (

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">

                  <Activity className="h-3.5 w-3.5 animate-pulse" />

                  PROCESSING BILLING CHECKPOINT...

                </div>

              )}

            </div>


            {/* MODAL FOOTER */}

            <div className="px-6 pb-6">

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">

                <div className="flex items-start gap-3">

                  <Shield className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />

                  <p className="text-[10px] leading-relaxed text-slate-600 font-mono">

                    Mock Stripe Hook Session Engine.
                    Executing calls automatically
                    pushes an authorization-signed
                    event back to the gravity framework
                    router.

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      )
    }
    </div>
  );
} 
