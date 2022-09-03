import React, { useState } from "react";
import {
  List,
  ListSubheader,
  ListItemText,
  ListItem,
  Switch,
  ListItemSecondaryAction,
  Divider,
  Select,
  MenuItem,
  Button,
  Dialog,
  ListItemIcon,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Box,
  Modal,
  DialogActions,
} from "@material-ui/core";
import axios from "axios";
import { red } from "@material-ui/core/colors";
import { useSelector, useDispatch } from "react-redux";
import { l10nSelector, langSelector } from "../redux/l10n";
import { prefSelector } from "../redux/prefs";
import { version } from "../../package.json";
import { exportLogs, getPlatform, isAdmin, isWindows, startBinderProxy } from "../nativeGate";
import { GlobalState } from "../redux";
import { ConnectionStatus, SpecialConnStates } from "../redux/connState";
import LanguageIcon from "@material-ui/icons/Language";
import {
  Apps,
  BugReport,
  CallSplit,
  DeleteForever,
  RedoTwoTone,
  SwapHoriz,
  TripOrigin,
  Update,
  VpnLock,
  Web,
  WifiTethering,
} from "@material-ui/icons";
import ExcludeAppPicker from "./ExcludeAppPicker";

import adminImage from "../assets/windows-admin.jpg";
import axiosRetry, { exponentialDelay } from "axios-retry";
import { stopDaemon } from "../nativeGate";

const BooleanSetting = (props: {
  propKey: string;
  defValue: boolean;
  primary: string;
  secondary?: string;
  disabled?: boolean;
  icon: any;
}) => {
  const currValue = useSelector(
    prefSelector(props.propKey, props.defValue ? "true" : "false")
  );
  const dispatch = useDispatch();
  return (
    <ListItem>
      <ListItemIcon>{props.icon}</ListItemIcon>
      <ListItemText
        primary={props.primary}
        secondary={props.secondary}
        style={{ maxWidth: "60vw" }}
      />
      <ListItemSecondaryAction>
        <Switch
          checked={currValue === "true"}
          color="primary"
          onClick={() => {
            console.log(currValue);
            dispatch({
              type: "PREF",
              key: props.propKey,
              value: currValue === "true" ? "false" : "true",
            });
          }}
          disabled={props.disabled}
        />
      </ListItemSecondaryAction>
    </ListItem>
  );
};

// const ExclusionDialog = (props: { open: boolean }) => {
//   const l10n = useSelector(l10nSelector);
//   const dispatch = useDispatch();
//   const currList = useSelector(prefSelector("excludedApps", []));
//   const appList = {
//     weixin: "WeChat"
//   };

//   return (
//     <Dialog open={props.open} scroll="paper" fullWidth>
//       <DialogTitle>{l10n.excludeapps}</DialogTitle>
//     </Dialog>
//   );
// };


// const deleteAccount = async () => {
//   const username = useSelector(prefSelector("username", ""));
//   const password = useSelector(prefSelector("password", ""));

//   const proxClient = axios.create({ baseURL: "http://127.0.0.1:23456" });
//   axiosRetry(proxClient, {
//     retries: 1000,
//     retryDelay: exponentialDelay,
//   });

//   startBinderProxy();

//   try {
//     const resp = await proxClient.post("/delete_account", {
//       username: username,
//       password: password,
//     });

//   } catch (_) { }
// };

const SettingsFrag: React.FC = (props) => {
  const username = useSelector(prefSelector("username", ""));
  const password = useSelector(prefSelector("password", ""));
  const l10n = useSelector(l10nSelector);
  const lang = useSelector(langSelector);
  const listenAll = useSelector(prefSelector("listenAll", false));
  const useVpn = useSelector(prefSelector("vpn", false));
  const excludeApps =
    useSelector(prefSelector("excludeApps", false)) === "true";
  const stateConnected = useSelector(
    (state: GlobalState) => state.connState.connected
  );
  const dispatch = useDispatch();
  const [pickerOpened, setPickerOpened] = useState(false);
  const cannotVpnClose = () => {
    dispatch({
      type: "PREF",
      key: "vpn",
      value: "false",
    });
  };
  const [showModal, setShowModal] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  // const [isAdmin, setIsAdmin] = useState(false);
  // (async () => {
  //   setIsAdmin(await isElevated());
  //   alert(await isElevated());
  //   //=> false
  // })();


  const handleDeleteAccount = async () => {
    setDeleteInProgress(true);
    try {
      startBinderProxy();

      const proxClient = axios.create({ baseURL: "http://127.0.0.1:23456" });
      axiosRetry(proxClient, {
        retries: 1000,
        retryDelay: exponentialDelay,
      });

      await new Promise(r => setTimeout(r, 2000));

      try {
        const resp = await axios.post("http://127.0.0.1:23456/delete_account", {
          Username: username,
          Password: password,
        });

      } catch (e) {
        const s = ["Failed to delete account!\n", e].concat();
        alert(s);
        return;
      }
      // log out
      localStorage.clear();
      dispatch({ type: "CONN", rawJson: SpecialConnStates.Dead });
      stopDaemon();
      dispatch({ type: "PREF", key: "username", value: "" });
      dispatch({ type: "PREF", key: "password", value: "" });
    } finally {
      setShowModal(false);
      setDeleteInProgress(false);
    }
  }

  return (
    <>
      <Dialog
        open={useVpn === "true" && isWindows() && !isAdmin}
        onClose={cannotVpnClose}
      >
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            style={{ color: "black" }}
          >
            {l10n.cannotVpnBlurb}
          </DialogContentText>
          <DialogContentText>
            <img src={adminImage} style={{ width: "100%" }} />
          </DialogContentText>
          <Button onClick={cannotVpnClose} color="primary">
            OK
          </Button>
        </DialogContent>
      </Dialog>
      <List
        subheader={
          <ListSubheader component="div">{l10n.general}</ListSubheader>
        }
      >
        <ListItem>
          <ListItemIcon>
            <LanguageIcon />
          </ListItemIcon>
          <ListItemText primary={l10n.language} />
          <ListItemSecondaryAction>
            <Select
              value={lang}
              disableUnderline
              onChange={(event) => {
                dispatch({
                  type: "PREF",
                  key: "lang",
                  value: event.target.value,
                });
              }}
            >
              <MenuItem value="en-US">English</MenuItem>
              <MenuItem value="zh-TW">繁體中文</MenuItem>
              <MenuItem value="zh-CN">简体中文</MenuItem>
            </Select>
          </ListItemSecondaryAction>
        </ListItem>

        <Dialog
          open={pickerOpened}
          onClose={() => setPickerOpened(false)}
          fullScreen
        >
          <ExcludeAppPicker handleClose={() => setPickerOpened(false)} />
        </Dialog>

        {(getPlatform() === "android") ? (
          <>
            <BooleanSetting
              propKey="excludeApps"
              defValue={false}
              primary={l10n.excludeapps}
              secondary={l10n.excludeappsblurb}
              icon={<CallSplit />}
            />
            {excludeApps ? (
              <ListItem
                button
                style={{ paddingLeft: 32 }}
                onClick={() => setPickerOpened(true)}
              >
                <ListItemIcon>
                  <Apps />
                </ListItemIcon>
                <ListItemText primary={l10n.selectExcludedApps} />
              </ListItem>
            ) : (
              ""
            )}
          </>
        ) : (getPlatform() === "electron" ? (
          <>
            <BooleanSetting
              propKey="vpn"
              defValue={false}
              primary={l10n.vpn}
              secondary={l10n.vpnblurb}
              icon={<VpnLock />}
            />
            <BooleanSetting
              propKey="bypassChinese"
              defValue={false}
              primary={l10n.excludecn}
              secondary={l10n.excludecnblurb}
              icon={<CallSplit />}
            />
            <BooleanSetting
              propKey="autoProxy"
              defValue={true}
              primary={l10n.autoproxy}
              secondary={l10n.autoproxyblurb}
              icon={<Web />}
            />
          </>
        ) : "")
        }
      </List>
      <Divider />
      <List
        subheader={
          <ListSubheader component="div">{l10n.details}</ListSubheader>
        }
      >
        <BooleanSetting
          propKey="forceBridges"
          defValue={false}
          primary={l10n.forcebridges}
          secondary={l10n.bridgeblurb}
          icon={<SwapHoriz />}
        />
        <BooleanSetting
          propKey="useTCP"
          defValue={false}
          primary={l10n.tcp}
          icon={<TripOrigin />}
        />
        <>
          {(getPlatform() !== "ios") ? (
            <BooleanSetting
              propKey="listenAll"
              defValue={false}
              primary={l10n.listenall}
              secondary={l10n.listenallblurb}
              icon={<WifiTethering />}
            />) : ""
          }
          <List style={{ paddingLeft: 32 }}>
            <ListItem>
              <ListItemText primary={l10n.socks5} />
              <span style={{ color: "#666" }}>
                {listenAll == "true" ? "0.0.0.0" : "127.0.0.1"}:9909
              </span>
            </ListItem>
            <ListItem>
              <ListItemText primary={l10n.http} />
              <span style={{ color: "#666" }}>
                {listenAll == "true" ? "0.0.0.0" : "127.0.0.1"}:9910
              </span>
            </ListItem>
          </List>
        </>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <BugReport />
          </ListItemIcon>
          <ListItemText
            primary={l10n.feedback}
            secondary={l10n.feedbackblurb}
            style={{ maxWidth: "60vw" }}
          />
          <ListItemSecondaryAction>
            <Button
              color="primary"
              onClick={() => {
                exportLogs();
              }}
            >
              {l10n.export}
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Update />
          </ListItemIcon>
          <ListItemText primary={l10n.version} />
          <span style={{ color: "#666" }}>{version}</span>
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <DeleteForever />
          </ListItemIcon>
          <ListItemText
            primary={l10n.deleteAccount}
            secondary={l10n.deleteAccountBlurb}
            style={{ maxWidth: "60vw" }}
          />
          <ListItemSecondaryAction>
            <Button
              color="secondary"
              onClick={() => setShowModal(true)}>
              {l10n.delete}
            </Button>
            <Dialog
              open={showModal}
              aria-describedby="dialog-description"
            >
              <DialogContent>
                <DialogContentText id="dialog-description">
                  {l10n.confirm}
                </DialogContentText>
              </DialogContent>

              <DialogActions>
                <Button disabled={deleteInProgress} color="primary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button
                  color="secondary"
                  disabled={deleteInProgress}
                  onClick={handleDeleteAccount}>
                  Ok
                </Button>
              </DialogActions>
            </Dialog>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <div style={{ height: 50 }} />
    </>
  );
};

export default SettingsFrag;
