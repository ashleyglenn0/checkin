import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme
} from "@mui/material";

const SendAlertDialog = ({
  open,
  onClose,
  newAlert,
  setNewAlert,
  handleAddAlert
}) => {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.text.primary }}>
        Add New Alert
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Alert Message"
          value={newAlert.message}
          onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
          margin="normal"
        />
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Alert Type</InputLabel>
          <Select
            value={newAlert.severity}
            label="Alert Type"
            onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warning">Warning</MenuItem>
            <MenuItem value="error">Urgent</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Send To</InputLabel>
          <Select
            value={newAlert.audience}
            label="Send To"
            onChange={(e) => setNewAlert({ ...newAlert, audience: e.target.value })}
          >
            <MenuItem value="everyone">Everyone</MenuItem>
            <MenuItem value="admin-all">All Admins</MenuItem>
            <MenuItem value="admin-direct">Specific Admin</MenuItem>
            <MenuItem value="teamlead-all">All Team Leads</MenuItem>
            <MenuItem value="teamlead-direct">Team Leads on a Floor</MenuItem>
          </Select>
        </FormControl>

        {newAlert.audience === "admin-direct" && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Admin Name</InputLabel>
            <Select
              value={newAlert.adminName || ""}
              label="Admin Name"
              onChange={(e) => setNewAlert({ ...newAlert, adminName: e.target.value })}
            >
              <MenuItem value="Mikal">Mikal</MenuItem>
              <MenuItem value="Reba">Reba</MenuItem>
              <MenuItem value="Lloyd">Lloyd</MenuItem>
              <MenuItem value="Ashley">Ashley</MenuItem>
            </Select>
          </FormControl>
        )}

        {newAlert.audience === "teamlead-direct" && (
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Target Floor</InputLabel>
            <Select
              value={newAlert.floor || ""}
              label="Target Floor"
              onChange={(e) => setNewAlert({ ...newAlert, floor: e.target.value })}
            >
              <MenuItem value="Main Stage">Main Stage</MenuItem>
              <MenuItem value="Career Expo Hall">Career Expo Hall</MenuItem>
              <MenuItem value="Mini Stages">Mini Stages</MenuItem>
              <MenuItem value="Registration">Registration</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAddAlert} color="primary">
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendAlertDialog;
