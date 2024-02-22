// Assets need to be imported into the module, or they are not available
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule, FormsModule, hookNavigator, hookRoute } from '@c8y/ngx-components';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { FormlyModule } from '@ngx-formly/core';
import { TenantOptionManagementComponent } from './tenant-option-management.component';
import { TenantOptionManagementService } from './tenant-option-management.service';
import { AddOptionModalComponent } from './add-option/add-option-modal.component';
import { JsonEditorComponent } from './editor/jsoneditor.component';
import { TemplateComponent } from './template/template.component';
import { PanelWrapperComponent } from './template/panel-wrapper.component';
import { ImportOptionModalComponent } from './import-option/import-option-modal.component';
import { ExportModalComponent } from './export-modal/export-modal.component';
import { FileImportModalComponent } from './file-import-modal/file-import-modal.component';

@NgModule({
  declarations: [
    TenantOptionManagementComponent,
    AddOptionModalComponent,
    ImportOptionModalComponent,
    FileImportModalComponent,
    ExportModalComponent,
    JsonEditorComponent,
    TemplateComponent,
    PanelWrapperComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    CoreModule,
    ButtonsModule,
    FormlyModule.forRoot({
      wrappers: [{ name: 'panel', component: PanelWrapperComponent }],
    }),
  ],
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
