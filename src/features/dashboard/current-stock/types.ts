export type CurrentStockRow = {
  id: number
  recDate: string
  custNo: string
  custName: string
  receivedType: string
  itemNo: string
  itemName: string
  batch: string
  barcode: string
  location: string
  headsPacks: number
  quantity: number
  weight: number
  uom: string
  pd: string
  ed: string
  expiryStatus: "GOOD" | "NEAR EXPIRY" | "EXPIRED"
}


export type Filters = {
  showdetails: "0" | "1"
  withpendings: "0" | "1"
  itemno: string
  batch: string
  location: string
  status: "all" | "GOOD" | "NEAR EXPIRY" | "EXPIRED"
  tagno: string
  receivedtype: string
  custno: string
  prd_from: string
  prd_to: string
  exp_from: string
  exp_to: string
  rec_from: string
  rec_to: string
}