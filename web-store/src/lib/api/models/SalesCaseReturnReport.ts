/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ItemReturnSummary } from './ItemReturnSummary';
export type SalesCaseReturnReport = {
    case_id: number;
    new_order_id?: (number | null);
    sales_rep_id: number;
    date_returned: string;
    total_items_sold: number;
    total_value_sold: number;
    items_summary: Array<ItemReturnSummary>;
};

