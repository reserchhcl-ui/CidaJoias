/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesCaseItemResponse } from './SalesCaseItemResponse';
export type SalesCaseResponse = {
    id: number;
    sales_rep_id: number;
    loan_date: string;
    return_by_date: string;
    status: string;
    items?: Array<SalesCaseItemResponse>;
};

