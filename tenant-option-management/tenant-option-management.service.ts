import { Injectable } from '@angular/core';
import { IManagedObject, ITenantOption, InventoryService, TenantOptionsService } from '@c8y/client';
import { TenantOptionRow } from './tenant-option-management.component';
import { cloneDeep } from 'lodash';

export interface TenantOptionConfiguration extends IManagedObject {
  type: 'tenant_option_plugin_config';
  options: ITenantOption[];
}
@Injectable()
export class TenantOptionManagementService {
  constructor(private inventory: InventoryService, private tenantOption: TenantOptionsService) {}

  async getConfiguration(): Promise<TenantOptionConfiguration> {
    const { data } = await this.inventory.list({
      pageSize: 1,
      type: 'tenant_option_plugin_config',
      withTotalPages: false,
      withChildren: false,
    });

    if (data.length) {
      return data[0] as TenantOptionConfiguration;
    } else {
      return (
        await this.inventory.create({
          type: 'tenant_option_plugin_config',
          options: [],
        })
      ).data as TenantOptionConfiguration;
    }
  }

  async addOption(
    option: ITenantOption & { encrypted: string }
  ): Promise<ITenantOption & { encrypted: string }> {
    await this.tenantOption.create(option);

    await this.addOptionToConfiguration(option);
    return option;
  }

  private async addOptionToConfiguration(option: ITenantOption & { encrypted: string }) {
    const config = await this.getConfiguration();
    if (config.options.find((o) => o.category === option.category && o.key === option.key)) {
      return Promise.reject('Tenant option already exists!');
    }
    const toSend = cloneDeep(option);
    delete toSend.value;
    config.options.push(toSend);
    return this.inventory.update({ id: config.id, options: config.options });
  }

  async importOption(keyCategory: ITenantOption): Promise<ITenantOption & { encrypted: string }> {
    const { data: option } = await this.tenantOption.detail(keyCategory);
    const combined = { ...option, encrypted: option.key.startsWith('credentials') ? '1' : '0' };
    await this.addOptionToConfiguration(combined);
    return combined;
  }

  updateOption(option: ITenantOption) {
    return this.tenantOption.update(option);
  }

  getAllOptions() {
    return this.tenantOption
      .list({
        pageSize: 2000,
      })
      .then((res) => res.data.map((o) => ({ id: `${o.category}-${o.key}`, value: o.value })));
  }

  async deleteOption(row: TenantOptionRow) {
    try {
      await this.tenantOption.delete({ category: row.category, key: row.key });
    } catch (e) {
      console.warn(e);
    }
    const config = await this.getConfiguration();
    const delta = {
      id: config.id,
      options: config.options.filter((o) => o.category !== row.category || o.key !== row.key),
    };
    await this.inventory.update(delta);
  }
}