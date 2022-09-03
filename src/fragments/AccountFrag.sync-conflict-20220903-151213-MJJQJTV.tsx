import React, { useState } from "react";
import { sha256 } from "js-sha256";
import {
  List,
  ListSubheader,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Divider,
  IconButton,
} from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import { useSelector, useDispatch } from "react-redux";
import { l10nSelector, langSelector } from "../redux/l10n";
import { AccountCircle, Favorite, DateRange } from "@material-ui/icons";
import { prefSelector } from "../redux/prefs";
import { GlobalState } from "../redux";
import { SpecialConnStates } from "../redux/connState";
import { getPlatform, stopDaemon } from "../nativeGate";

const AccountFrag = (props: { forceSync: () => void }) => {
  const l10n = useSelector(l10nSelector);
  const lang = useSelector(langSelector);
  const username = useSelector(prefSelector("username", ""));
  const password = useSelector(prefSelector("password", ""));
  const dispatch = useDispatch();
  const acctState = useSelector((state: GlobalState) => state.acctState);
  const extendURL = `https://geph.io/billing/login?next=%2Fbilling%2Fdashboard&uname=${encodeURIComponent(
    username
  )}&pwd=${encodeURIComponent(password)}`;
  const openBilling = () => {
    if (getPlatform() !== "electron") {
      window.location.href = extendURL;
    } else {
      window.open(extendURL, "_blank");
    }
  };
  const isFree = acctState && acctState.subscription === null;
  return (
    <>
      <List>
        <ListItem>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText
            style={{
              overflow: "hidden",
              maxWidth: "calc(100vw - 200px)",
              textOverflow: "ellipsis",
            }}
          >
            <b>{username}</b>
          </ListItemText>
          <ListItemSecondaryAction>
            <IconButton aria-label="refresh" onClick={(e) => props.forceSync()}>
              <RefreshIcon />
            </IconButton>
            <Button
              color="secondary"
              variant="outlined"
              disableElevation
              onClick={() => {
                localStorage.clear();
                dispatch({ type: "CONN", rawJson: SpecialConnStates.Dead });
                stopDaemon();
                dispatch({ type: "PREF", key: "username", value: "" });
                dispatch({ type: "PREF", key: "password", value: "" });
              }}
              style={{ minWidth: 100 }}
            >
              {l10n.logout}
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        <>
          {isFree ? (
            <ListItem>
              <ListItemIcon>
                <Favorite color="secondary" />
              </ListItemIcon>
              <ListItemText>{l10n.unlockUnlimitedSpeed}</ListItemText>
              <ListItemSecondaryAction>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={openBilling}
                  disableElevation
                  style={{ minWidth: 100 }}
                >
                  {l10n.upgrade}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ) : (
            <ListItem>
              <ListItemIcon>
                <DateRange color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={new Date(
                  ((acctState &&
                    acctState.subscription &&
                    acctState.subscription.expires_unix) ||
                    0) * 1000
                ).toLocaleDateString(lang, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                secondary={formatRemaining(
                  l10n,
                  new Date(
                    ((acctState &&
                      acctState.subscription &&
                      acctState.subscription.expires_unix) ||
                      0) * 1000
                  )
                )}
              ></ListItemText>
              <ListItemSecondaryAction>
                <Button
                  color="primary"
                  variant="outlined"
                  onClick={openBilling}
                  disableElevation
                  style={{ minWidth: 100 }}
                >
                  {l10n.extend}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          )}
        </>
      </List>
    </>
  );
};

const formatRemaining = (l10n: Record<string, any>, date: Date) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const timeLeft = date.getTime() - new Date().getTime();
  const daysLeft = timeLeft / msPerDay;
  const nana = l10n.fmtDaysLeftShort as (x: string) => string;
  return nana(daysLeft.toFixed(0));
};

export default AccountFrag;
