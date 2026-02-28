export function HelpModal() {
  return (
    <box flexDirection="column" width="100%" height="100%" alignItems="center" justifyContent="center">
      <box border width="78%" height="74%" padding={1} flexDirection="column">
        <text>
          <strong>CLI Help</strong>
        </text>
        <box marginTop={1}>
          <text>
            <span fg="#93C5FD">Global</span>
            <br />
            <span fg="#D1D5DB">?           Toggle this help modal</span>
            <br />
            <span fg="#D1D5DB">q / ctrl+c  Exit the CLI</span>
            <br />
            <span fg="#D1D5DB">esc         Close overlays or exit</span>
            <br />
            <br />
            <span fg="#93C5FD">Dashboard</span>
            <br />
            <span fg="#D1D5DB">h           Hide/show all currency values</span>
            <br />
            <span fg="#D1D5DB">left/right  Previous/next transactions page</span>
            <br />
            <span fg="#D1D5DB">t           Open assets modal</span>
            <br />
            <span fg="#D1D5DB">w           Open wallets modal</span>
            <br />
            <br />
            <span fg="#93C5FD">Assets Modal</span>
            <br />
            <span fg="#D1D5DB">/           Search by asset symbol or name</span>
            <br />
            <span fg="#D1D5DB">up/down     Move selected asset row</span>
            <br />
            <span fg="#D1D5DB">enter       Open selected asset preview</span>
            <br />
            <span fg="#D1D5DB">left/right  Previous/next assets page</span>
            <br />
            <br />
            <span fg="#93C5FD">Wallets Modal</span>
            <br />
            <span fg="#D1D5DB">up/down     Move selected wallet row</span>
            <br />
            <span fg="#D1D5DB">c / enter   Copy selected wallet address</span>
          </text>
        </box>
      </box>
    </box>
  )
}
