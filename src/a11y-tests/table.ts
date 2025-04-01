import { expect } from '@storybook/test';
import {
  findByShadowRole,
  findAllByShadowRole,
  deepQuerySelector,
} from 'shadow-dom-testing-library';

import { Step } from './types';

// https://www.w3.org/WAI/ARIA/apg/patterns/table/
export const a11yTable = async ({
  step,
  canvasElement,
}: {
  canvasElement: HTMLElement;
  step: Step;
}) => {
  const table = await findByShadowRole(canvasElement, 'table');

  // Roles
  await step('The table container element has a role of table.', async () => {
    await expect(table).toBeInTheDocument();
  });

  await step('Each row container element has a role of row.', async () => {
    // Find the thead and tbody elements
    const thead = deepQuerySelector(table, ':scope > thead') as HTMLElement;
    const tbody = deepQuerySelector(table, ':scope > tbody') as HTMLElement;

    // Find all the direct children of thead and tbody
    const theadChildren: any = thead ? thead.children : [];
    const tbodyChildren: any = tbody ? tbody.children : [];

    // Find all the rows in the thead and tbody using findAllByShadowRole
    const theadRows = thead ? await findAllByShadowRole(thead, 'row') : [];
    const tbodyRows = await findAllByShadowRole(tbody, 'row');

    // Check that the rows match the children
    await expect(theadRows.length).toBe(theadChildren.length);
    await expect(tbodyRows.length).toBe(tbodyChildren.length);
  });

  await step(
    'Each column header cell has a role of columnheader.',
    async () => {
      // Get the thead element
      const thead = deepQuerySelector(table, ':scope > thead');

      if (!thead) {
        return;
      }

      const theadRow = await findByShadowRole(thead, 'row');

      // Get all the direct children of thead that have text
      const theadChildren = Array.from(theadRow.children).filter((child) =>
        child.textContent?.trim(),
      );

      // Check that the number of column headers matches the number of children
      const columnHeaderCells = await findAllByShadowRole(
        thead,
        'columnheader',
      );
      await expect(columnHeaderCells.length).toBe(theadChildren.length);
    },
  );

  // Combined spec rule
  await step(
    'Each data cell element has a role of cell or row header.',
    async () => {
      const tbody = deepQuerySelector(table, ':scope > tbody') as HTMLElement;
      const tbodyRows = await findAllByShadowRole(tbody, 'row');

      for (const row of tbodyRows) {
        const directRowChildren = Array.from(row.children);
        const cells = await findAllByShadowRole(row, 'cell');

        let rowHeaderCells = [];
        try {
          rowHeaderCells = await findAllByShadowRole(row, 'rowheader');
        } catch (error) {
          // Row headers are optional
        }

        // Check that all cells have a role of cell or rowheader
        await expect(cells.length + rowHeaderCells.length).toBe(
          directRowChildren.length,
        );
      }
    },
  );

  // Properties
  await step(
    'If the table has a caption or title, the table element has aria-labelledby set to the ID of the caption/title element.',
    async () => {
      const ariaLabelledby = table.getAttribute('aria-labelledby');
      const ariaLabel = table.getAttribute('aria-label');

      // Check for a caption element
      let caption;
      try {
        caption = deepQuerySelector(table, ':scope > caption');
      } catch (error) {
        caption = null;
      }

      if (caption) {
        // If a caption exists, it should be referenced by aria-labelledby
        await expect(ariaLabelledby).toBeTruthy();
        const labelElement = document.getElementById(ariaLabelledby || '');
        await expect(labelElement).toBeTruthy();
      } else if (ariaLabelledby) {
        // If aria-labelledby is provided, the referenced element should exist
        const labelElement = document.getElementById(ariaLabelledby);
        await expect(labelElement).toBeTruthy();
      } else {
        // If no caption or aria-labelledby, there should be an aria-label
        await expect(ariaLabel).toBeTruthy();
      }
    },
  );

  await step(
    'If the table element has an associated description, the table element has aria-describedby set to the ID of the description element.',
    async () => {
      const ariaDescribedby = table.getAttribute('aria-describedby');

      if (ariaDescribedby) {
        const descriptionElement = document.getElementById(ariaDescribedby);
        await expect(descriptionElement).toBeTruthy();
      }
    },
  );

  // TODO Handle sorting
  // If the column or row header cells are sortable, they have the attribute aria-sort set to reflect the current sort state: ascending, descending, or other.

  // TODO Handle handle multiple row and column span
  // I think this applies more to faked tables as a real one will already have rowspan or colspan
  // If a cell spans multiple rows or columns, it has aria-rowspan or aria-colspan attributes.
};
