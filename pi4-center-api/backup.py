import tkinter as tk
import time
import pyodbc

# =========================================================================
# Configuration
# =========================================================================

GREEN_DURATION = 10  # Duration for green light in seconds
YELLOW_DURATION = 3  # Duration for yellow light in seconds
LIGHT_SIZE = 40      # Size of the traffic light circle in pixels
SPACING = 10         # Spacing between lights in pixels
CENTER_X = 275       # X-coordinate of the window center
CENTER_Y = 275       # Y-coordinate of the window center
OFFSET = 150         # Distance from the center for each traffic light

# =========================================================================
# Database Connection Function
# =========================================================================

def fetch_current_mode_from_db():
    """
    Fetches the latest operating mode from the 'stl.Mode_Log' table
    and retrieves the corresponding 'Mode_Name' from 'stl.Traffic_Mode'.
    """
    try:
        cnxn_str = (
            "Driver={ODBC Driver 17 for SQL Server};"
            "Server=DESKTOP-QDN7QAS;"
            "Database=Smart_Traffic_Light;"
            "UID=admin;"
            "PWD=1234;"
        )
        cnxn = pyodbc.connect(cnxn_str)
        cursor = cnxn.cursor()
        
        # Get the latest Mode_ID from the log table
        cursor.execute("SELECT TOP 1 Mode_ID FROM stl.Mode_Log ORDER BY Create_Date DESC")
        last_mode_id = cursor.fetchone()[0]
        
        # Get the Mode_Name corresponding to the latest Mode_ID
        cursor.execute("SELECT Mode_Name FROM stl.Traffic_Mode WHERE Mode_ID = ?", last_mode_id)
        mode_name = cursor.fetchone()[0]
        
        cnxn.close()
        return mode_name
    except Exception as e:
        print(f"Database connection error: {e}")
        return "Auto" # Default to "Auto" mode on connection failure

# =========================================================================
# Traffic Light GUI Class
# =========================================================================

class TrafficLightGUI:
    def __init__(self, root, name, x_pos, y_pos):
        self.root = root
        self.name = name
        self.status = 'red'
        self.timer_value = 0
        self.timer_id = None
        self.callback = None
        self.callback_args = []
        self.flash_id = None
        self.flash_state = False

        self.frame = tk.Frame(root, bg='gray20', padx=10, pady=10)
        self.frame.place(x=x_pos, y=y_pos, anchor='center')

        self.name_label = tk.Label(self.frame, text=self.name, fg='white', bg='gray20', font=('Arial', 12, 'bold'))
        self.name_label.pack(side=tk.TOP)

        self.canvas = tk.Canvas(self.frame, width=LIGHT_SIZE, height=(LIGHT_SIZE + SPACING) * 3, bg='gray20', bd=0, highlightthickness=0)
        self.canvas.pack(pady=5)
        
        y_pos_red = 0
        y_pos_yellow = y_pos_red + LIGHT_SIZE + SPACING
        y_pos_green = y_pos_yellow + LIGHT_SIZE + SPACING
        
        self.red_light = self.canvas.create_oval(0, y_pos_red, LIGHT_SIZE, y_pos_red + LIGHT_SIZE, fill='gray50')
        self.yellow_light = self.canvas.create_oval(0, y_pos_yellow, LIGHT_SIZE, y_pos_yellow + LIGHT_SIZE, fill='gray50')
        self.green_light = self.canvas.create_oval(0, y_pos_green, LIGHT_SIZE, y_pos_green + LIGHT_SIZE, fill='gray50')
        
        self.timer_label = tk.Label(self.frame, text="", fg='white', bg='gray20', font=('Arial', 24, 'bold'))
        self.timer_label.pack(side=tk.BOTTOM)

    def set_status(self, new_status, duration, callback=None, *callback_args):
        """Sets a new status for the light and starts a countdown."""
        if self.timer_id:
            self.root.after_cancel(self.timer_id)
        if self.flash_id:
            self.root.after_cancel(self.flash_id)

        self.status = new_status
        self.timer_value = duration
        self.callback = callback
        self.callback_args = callback_args
        self.update_colors()
        self.update_timer()
        
    def start_flashing_yellow(self):
        """Starts the flashing yellow light mode."""
        self.canvas.itemconfig(self.red_light, fill='gray50')
        self.canvas.itemconfig(self.green_light, fill='gray50')
        self.flash_state = not self.flash_state
        fill_color = 'yellow' if self.flash_state else 'gray50'
        self.canvas.itemconfig(self.yellow_light, fill=fill_color)
        self.timer_label.config(text="")
        self.flash_id = self.root.after(500, self.start_flashing_yellow)
        
    def start_flashing_red(self):
        """Starts the flashing red light mode."""
        self.canvas.itemconfig(self.yellow_light, fill='gray50')
        self.canvas.itemconfig(self.green_light, fill='gray50')
        self.flash_state = not self.flash_state
        fill_color = 'red' if self.flash_state else 'gray50'
        self.canvas.itemconfig(self.red_light, fill=fill_color)
        self.timer_label.config(text="")
        self.flash_id = self.root.after(500, self.start_flashing_red)

    def update_colors(self):
        """Updates the color of the three lights based on the current status."""
        self.canvas.itemconfig(self.red_light, fill='gray50')
        self.canvas.itemconfig(self.yellow_light, fill='gray50')
        self.canvas.itemconfig(self.green_light, fill='gray50')
        
        if self.status == 'red':
            self.canvas.itemconfig(self.red_light, fill='red')
        elif self.status == 'yellow':
            self.canvas.itemconfig(self.yellow_light, fill='yellow')
        elif self.status == 'green':
            self.canvas.itemconfig(self.green_light, fill='green')

    def update_timer(self):
        """Updates the countdown timer and checks for phase change conditions."""
        self.timer_label.config(text=str(self.timer_value))

        if self.timer_value > 0:
            self.timer_value -= 1
            self.timer_id = self.root.after(1000, self.update_timer)
        else:
            if self.callback:
                self.callback(*self.callback_args)

# =========================================================================
# Traffic Controller Class
# =========================================================================

class TrafficControllerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Traffic Light Simulator")
        self.root.geometry("600x600")
        self.root.configure(bg='gray10')
        
        self.mode_label = tk.Label(root, text="Mode: Auto", fg='white', bg='gray10', font=('Arial', 18, 'bold'))
        self.mode_label.pack(side="bottom", pady=10)

        self.lights = {
            'N': TrafficLightGUI(self.root, "North", CENTER_X, CENTER_Y - OFFSET),
            'E': TrafficLightGUI(self.root, "East", CENTER_X + OFFSET, CENTER_Y),
            'S': TrafficLightGUI(self.root, "South", CENTER_X, CENTER_Y + OFFSET),
            'W': TrafficLightGUI(self.root, "West", CENTER_X - OFFSET, CENTER_Y)
        }
        
        self.mode = fetch_current_mode_from_db()
        self.pending_mode = None
        print(f"Initial mode: {self.mode}")
        
        self.current_phase = 0
        self.run_mode()
        self.check_mode_loop()

    def check_mode_loop(self):
        """Periodically checks the database for the current operating mode."""
        new_mode = fetch_current_mode_from_db()
        
        if new_mode != self.mode:
            if self.mode == 'Auto':
                self.pending_mode = new_mode
                print(f"Pending mode change to: {self.pending_mode}")
            else:
                self.mode = new_mode
                print(f"Changing mode to: {self.mode}")
                self.run_mode()

        self.root.after(3000, self.check_mode_loop)

    def run_mode(self):
        """Executes the appropriate function based on the fetched mode."""
        self.mode_label.config(text=f"Mode: {self.mode}")
        
        for light in self.lights.values():
            if light.timer_id:
                self.root.after_cancel(light.timer_id)
            if light.flash_id:
                self.root.after_cancel(light.flash_id)
        
        if self.mode == 'Auto':
            self.start_cycle()
        elif self.mode == 'Caution':
            for light in self.lights.values():
                light.start_flashing_yellow()
        elif self.mode == 'Stop':
            for light in self.lights.values():
                light.start_flashing_red()

    def start_cycle(self):
        """Starts the normal traffic light cycle."""
        phase_duration = GREEN_DURATION + YELLOW_DURATION
        
        if self.current_phase == 0:
            self.run_phase_N_green(phase_duration)
        elif self.current_phase == 1:
            self.run_phase_N_yellow(phase_duration)
        elif self.current_phase == 2:
            self.run_phase_E_green(phase_duration)
        elif self.current_phase == 3:
            self.run_phase_E_yellow(phase_duration)
        elif self.current_phase == 4:
            self.run_phase_S_green(phase_duration)
        elif self.current_phase == 5:
            self.run_phase_S_yellow(phase_duration)
        elif self.current_phase == 6:
            self.run_phase_W_green(phase_duration)
        elif self.current_phase == 7:
            self.run_phase_W_yellow(phase_duration)

    def check_for_immediate_mode_change(self, phase_duration):
        """
        Checks for a pending mode change and transitions immediately.
        """
        if self.pending_mode:
            self.mode = self.pending_mode
            self.pending_mode = None
            print(f"Green/Yellow phase finished. Switching to: {self.mode}")
            self.run_mode()
        else:
            if self.current_phase == 1:
                self.run_phase_E_green(phase_duration)
            elif self.current_phase == 3:
                self.run_phase_S_green(phase_duration)
            elif self.current_phase == 5:
                self.run_phase_W_green(phase_duration)
            elif self.current_phase == 7:
                self.run_phase_N_green(phase_duration)
    
    def run_phase_N_green(self, phase_duration):
        self.lights['N'].set_status('green', GREEN_DURATION, self.run_phase_N_yellow, phase_duration)
        self.lights['E'].set_status('red', phase_duration)
        self.lights['S'].set_status('red', phase_duration * 2)
        self.lights['W'].set_status('red', phase_duration * 3)
        self.current_phase = 1

    def run_phase_N_yellow(self, phase_duration):
        self.lights['N'].set_status('yellow', YELLOW_DURATION, self.check_for_immediate_mode_change, phase_duration)
        self.lights['E'].set_status('red', YELLOW_DURATION)
        self.lights['S'].set_status('red', phase_duration + YELLOW_DURATION)
        self.lights['W'].set_status('red', phase_duration * 2 + YELLOW_DURATION)
        self.current_phase = 2

    def run_phase_E_green(self, phase_duration):
        self.lights['N'].set_status('red', phase_duration * 3)
        self.lights['E'].set_status('green', GREEN_DURATION, self.run_phase_E_yellow, phase_duration)
        self.lights['S'].set_status('red', phase_duration)
        self.lights['W'].set_status('red', phase_duration * 2)
        self.current_phase = 3
    
    def run_phase_E_yellow(self, phase_duration):
        self.lights['N'].set_status('red', phase_duration * 2 + YELLOW_DURATION)
        self.lights['E'].set_status('yellow', YELLOW_DURATION, self.check_for_immediate_mode_change, phase_duration)
        self.lights['S'].set_status('red', YELLOW_DURATION)
        self.lights['W'].set_status('red', phase_duration + YELLOW_DURATION)
        self.current_phase = 4
    
    def run_phase_S_green(self, phase_duration):
        self.lights['N'].set_status('red', phase_duration * 2)
        self.lights['E'].set_status('red', phase_duration * 3)
        self.lights['S'].set_status('green', GREEN_DURATION, self.run_phase_S_yellow, phase_duration)
        self.lights['W'].set_status('red', phase_duration)
        self.current_phase = 5

    def run_phase_S_yellow(self, phase_duration):
        self.lights['N'].set_status('red', phase_duration + YELLOW_DURATION)
        self.lights['E'].set_status('red', phase_duration * 2 + YELLOW_DURATION)
        self.lights['S'].set_status('yellow', YELLOW_DURATION, self.check_for_immediate_mode_change, phase_duration)
        self.lights['W'].set_status('red', YELLOW_DURATION)
        self.current_phase = 6
        
    def run_phase_W_green(self, phase_duration):
        self.lights['N'].set_status('red', phase_duration)
        self.lights['E'].set_status('red', phase_duration * 2)
        self.lights['S'].set_status('red', phase_duration * 3)
        self.lights['W'].set_status('green', GREEN_DURATION, self.run_phase_W_yellow, phase_duration)
        self.current_phase = 7

    def run_phase_W_yellow(self, phase_duration):
        self.lights['N'].set_status('red', YELLOW_DURATION)
        self.lights['E'].set_status('red', phase_duration + YELLOW_DURATION)
        self.lights['S'].set_status('red', phase_duration * 2 + YELLOW_DURATION)
        self.lights['W'].set_status('yellow', YELLOW_DURATION, self.check_for_immediate_mode_change, phase_duration)
        self.current_phase = 0

# =========================================================================
# Main Execution Block
# =========================================================================

if __name__ == "__main__":
    root = tk.Tk()
    app = TrafficControllerGUI(root)
    root.mainloop()