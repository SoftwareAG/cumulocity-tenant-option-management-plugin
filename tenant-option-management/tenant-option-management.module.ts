// Assets need to be imported into the module, or they are not available
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule, FormsModule, hookNavigator, hookRoute } from '@c8y/ngx-components';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TenantOptionManagementComponent } from './tenant-option-management.component';
import { TenantOptionManagementService } from './tenant-option-management.service';
import { AddOptionModalComponent } from './add-option/add-option-modal.component';
import { JsonEditorComponent } from './editor/jsoneditor.component';

@NgModule({
  declarations: [TenantOptionManagementComponent, AddOptionModalComponent, JsonEditorComponent],
  imports: [CommonModule, FormsModule, CoreModule, ButtonsModule],
  exports: [],
  providers: [
    TenantOptionManagementService,
    hookNavigator({
      icon: 'diamond',
      path: 'tenant-option-management',
      label: 'Tenant Options',
    }),
    hookRoute({
      path: 'tenant-option-management',
      component: TenantOptionManagementComponent,
    }),
  ],
})
export class TenantOptionManagementModule {}
