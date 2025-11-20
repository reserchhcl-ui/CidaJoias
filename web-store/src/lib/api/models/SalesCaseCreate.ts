/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SalesCaseItemCreate } from './SalesCaseItemCreate';
export type SalesCaseCreate = {
    sales_rep_id: number;
    /**
     * Duration in days (1-90)
     */
    loan_duration_days: number;
    items: Array<SalesCaseItemCreate>;
};

