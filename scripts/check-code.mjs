import * as inventoryActions from '../src/app/actions/inventory.js'

console.log('Available Actions:', Object.keys(inventoryActions))
if (inventoryActions.getInventoryLogs) {
    console.log('getInventoryLogs is available.')
} else {
    console.log('getInventoryLogs is MISSING!')
}
