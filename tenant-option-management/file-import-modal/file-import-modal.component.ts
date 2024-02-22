/* eslint-disable @typescript-eslint/no-floating-promises */
import { Component } from '@angular/core';
import { ITenantOption, TenantOptionsService } from '@c8y/client';
import {
  AlertService,
  Column,
  ColumnDataType,
  DisplayOptions,
  ModalService,
  Pagination,
  Status,
  _,
} from '@c8y/ngx-components';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { TenantOptionRow, ImportStatus } from '../tenant-option-management.component';
import { TenantOptionManagementService } from '../tenant-option-management.service';
import { isEmpty } from 'lodash';

@Component({
  templateUrl: './file-import-modal.component.html',
})
export class FileImportModalComponent {
  closeSubject: Subject<(ITenantOption & { encrypted: string }) | null> = new Subject();

  columns: Column[] = [];
  rows: TenantOptionRow[] = [];
  selectedItems: TenantOptionRow[] = [];

  displayOptions: DisplayOptions = {
    bordered: false,
    gridHeader: true,
    striped: false,
    filter: false,
  };

  pagination: Pagination = {
    pageSize: 30,
    currentPage: 1,
  };

  selectable = true;

  isLoading = false;

  title = 'Tenant Options Export';

  constructor(
    private modal: BsModalRef,
    private alertService: AlertService,
    private optionsManagement: TenantOptionManagementService,
    private tenantOptionService: TenantOptionsService,
    protected confirmationModal: ModalService,
    protected translateService: TranslateService
  ) {
    this.columns = this.getDefaultColumns();
  }

  getDefaultColumns(): Column[] {
    return [
      {
        header: 'Category',
        name: 'category',
        path: 'category',
        filterable: true,
        dataType: ColumnDataType.TextShort,
      },
      {
        header: 'Key',
        name: 'key',
        path: 'key',
        filterable: true,
        dataType: ColumnDataType.TextShort,
      },
      {
        header: 'Status',
        name: 'status',
        path: 'status',
        filterable: true,
        dataType: ColumnDataType.TextShort,
      },
    ];
  }

  onFileSelected(event) {
    const file: File = event.target.files[0];

    if (file && file.type === 'application/json') {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const fileContent = e.target.result;
          this.rows = JSON.parse(fileContent);
          this.rows.forEach((row) => {
            this.tenantOptionService
              .detail({ category: row.category, key: row.key })
              .then((_option) => {
                row.status = ImportStatus.CONFLICT;
              })
              .catch((_error) => {
                row.status = ImportStatus.NEW;
              });
          });
        } catch (error) {
          this.alertService.danger('Invalid file content. Please select a valid JSON file.');
          console.warn(error);
        }
      };

      reader.readAsText(file);
    } else {
      this.alertService.danger('Invalid file type. Please select a JSON file.');
      console.warn('Invalid file type. Please select a JSON file.');
    }
  }

  async onItemsSelect(selectedItemIds: string[]) {
    if (
      this.rows.filter((r) => r.status === 'CONFLICT' && selectedItemIds.includes(r.id)).length > 0
    ) {
      await this.confirmationModal
        .confirm(
          _('Overwrite Tenant Options') as string,
          _(
            'There is an existing tenant option with the same categroy and key. Do you want to continue an overwrite that one?'
          ) as string,
          Status.DANGER,
          { ok: _('Overwritte') as string, cancel: _('Cancel') as string }
        )
        .then((result) => {
          if (result) {
            this.selectedItems = this.rows.filter((r) => selectedItemIds.includes(r.id));
            this.rows
              .filter((r) => r.status === ImportStatus.CONFLICT && selectedItemIds.includes(r.id))
              .forEach((r) => (r.status = ImportStatus.OVERWRITE));
          } else {
            this.selectedItems = this.rows.filter(
              (r) => r.status === ImportStatus.NEW && selectedItemIds.includes(r.id)
            );
          }
        });
    } else {
      this.selectedItems = this.rows.filter((r) => selectedItemIds.includes(r.id));
    }
  }

  reload() { }

  async import() {
    if (this.selectedItems.length > 0) {
      this.isLoading = true;
      for (const item of this.selectedItems) {
        await this.importOrUpdateItem(item);
      }
      this.isLoading = false;
      this.alertService.success('Tenant options imported successfully.');
      this.close();
    } else {
      this.alertService.danger('Please select at least one item to import.');
    }
  }

  async importOrUpdateItem(item: TenantOptionRow) {
    const row = this.rows.find((r) => r.id == item.id);
    if (!isEmpty(row)) {
      if (row.status === ImportStatus.OVERWRITE) {
        row.status = ImportStatus.LOADING;
        const option = {
          key: item.key,
          category: item.category,
          value: item.value,
          encrypted: '',
        };
        await this.optionsManagement.updateOption(option);
        try {
          await this.optionsManagement.addOptionToConfiguration(option);
        } catch (error) {
          // Ignore the rejection
        }
        row.status = ImportStatus.UPDATED;
      } else {
        row.status = ImportStatus.LOADING;
        const option = {
          key: item.key,
          category: item.category,
          value: item.value,
          encrypted: '',
        };
        await this.optionsManagement.addOption(option);
        row.status = ImportStatus.ADDED;
      }
    }
  }

  close() {
    this.closeSubject.next(null);
    this.modal.hide();
  }
}
