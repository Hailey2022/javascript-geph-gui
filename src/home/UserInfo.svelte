<script lang="ts">
  import AccountCircle from "svelte-material-icons/AccountCircle.svelte";
  import CalendarRange from "svelte-material-icons/CalendarRange.svelte";
  import TimerSandComplete from "svelte-material-icons/TimerSandComplete.svelte";
  import Heart from "svelte-material-icons/Heart.svelte";
  import { curr_lang, l10n, l10n_date } from "../lib/l10n";
  import { native_gate, type SubscriptionInfo } from "../native-gate";
  import { pref_userpwd } from "../lib/prefs";
  import GButton from "../lib/GButton.svelte";
  export let username: string;
  export let user_info: SubscriptionInfo | null = null;

  const on_logout = async () => {
    try {
      await native_gate().stop_daemon();
    } catch {}
    localStorage.clear();
    $pref_userpwd = null;
    window.location.reload();
  };

  $: extend_url = `https://geph.io/billing/login?next=%2Fbilling%2Fdashboard&uname=${encodeURIComponent(
    username
  )}&pwd=${encodeURIComponent($pref_userpwd ? $pref_userpwd.password : "")}`;
</script>

<div class="userinfo">
  <div class="urow">
    <AccountCircle width="1.5rem" height="1.5rem" color="#666" />
    <div class="stretch"><b>Premium</b></div>
    <GButton color={"warning"} inverted onClick={on_logout}>
      {l10n($curr_lang, "logout")}
    </GButton>
  </div>
</div>

<style>
  .userinfo {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .urow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
    width: 100%;

    height: 3rem;
  }

  .stretch {
    flex-grow: 1;
    padding-left: 1rem;
  }

  .days-left {
    opacity: 0.7;
  }

  :global(.red-button) {
    color: var(--mdc-theme-error) !important;
    border-color: var(--mdc-theme-error) !important;
  }

  :global(.blue-button) {
    color: var(--mdc-theme-primary) !important;
    border-color: var(--mdc-theme-primary) !important;
  }
</style>
