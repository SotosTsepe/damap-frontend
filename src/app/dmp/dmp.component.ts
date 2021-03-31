import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BackendService} from '../services/backend.service';
import {FormArray, FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {KeycloakService} from 'keycloak-angular';
import {Observable} from 'rxjs';
import {Person} from '../domain/person';
import {ProjectMember} from '../domain/project-member';
import {Project} from '../domain/project';
import {select, Store} from '@ngrx/store';
import {AppState} from '../store/states/app.state';
import {selectProjects, selectProjectsLoaded} from '../store/selectors/project.selectors';
import {LoadSuggestedProjects} from '../store/actions/project.actions';
import {FormService} from '../services/form.service';
import {Repository} from '../domain/repository';
import {selectRepositories, selectRepositoriesLoaded} from '../store/selectors/repository.selectors';
import {LoadRepositories, LoadRepository} from '../store/actions/repository.actions';
import {StepperSelectionEvent} from '@angular/cdk/stepper';
import {Storage} from '../domain/storage';

@Component({
  selector: 'app-dmp',
  templateUrl: './dmp.component.html',
  styleUrls: ['./dmp.component.css']
})
export class DmpComponent implements OnInit {

  userId: string;

  dmpForm: FormGroup = this.formService.createDmpForm();
  isLinear = false;

  // Steps
  projectStep: FormControl;
  contactStep: FormControl;
  contributorStep: FormArray;
  specifyDataStep: FormGroup;
  datasets: FormArray;
  docDataStep: FormGroup;
  legalEthicalStep: FormGroup;
  storageStep: FormArray;
  externalStorageStep: FormArray;
  externalStorageInfo: FormControl;
  repoStep: FormArray;
  restrictedAccessInfo: FormControl;
  closedAccessInfo: FormControl;
  reuseStep: FormGroup;
  costsStep: FormGroup;

  // Resources
  projectsLoaded$: Observable<boolean>;
  projects$: Observable<Project[]>;
  people: ProjectMember[];
  peopleList: ProjectMember[] = []; // people minus contributors
  repositories: any;
  repositoriesLoaded$: Observable<boolean>;
  repositories$: Observable<Repository[]>;

  // TODO: Manage editability based on accessType (role)
  constructor(
    private auth: KeycloakService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private route: ActivatedRoute,
    private router: Router,
    private backendService: BackendService,
    private store: Store<AppState>
    // private location: Location
  ) {
  }

  ngOnInit() {
    this.projectsLoaded$ = this.store.pipe(select(selectProjectsLoaded));
    this.projects$ = this.store.pipe(select(selectProjects));
    this.repositoriesLoaded$ = this.store.pipe(select(selectRepositoriesLoaded));
    this.repositories$ = this.store.pipe(select(selectRepositories));
    this.auth.loadUserProfile().then(
      p => {
        this.userId = p['attributes']?.tissID?.[0];
        this.getSuggestedProjects(this.userId);
      }
    );

    this.getDmpById();
    this.dmpForm.valueChanges.subscribe(() => console.log('DMPform Update'));
    this.dmpForm.valueChanges.subscribe(newVal => console.log(newVal));

    this.projectStep = this.dmpForm.get('project') as FormControl;
    this.contactStep = this.dmpForm.get('contact') as FormControl;
    this.contributorStep = this.dmpForm.get('contributors') as FormArray;
    this.specifyDataStep = this.dmpForm.get('data') as FormGroup;
    this.datasets = this.dmpForm.get('datasets') as FormArray;
    this.docDataStep = this.dmpForm.get('documentation') as FormGroup;
    this.legalEthicalStep = this.dmpForm.get('legal') as FormGroup;
    this.storageStep = this.dmpForm.get('storage') as FormArray;
    this.externalStorageStep = this.dmpForm.get('externalStorage') as FormArray;
    this.externalStorageInfo = this.dmpForm.get('externalStorageInfo') as FormControl;
    this.repoStep = this.dmpForm.get('hosts') as FormArray;
    this.restrictedAccessInfo = this.dmpForm.get('restrictedAccessInfo') as FormControl;
    this.closedAccessInfo = this.dmpForm.get('closedAccessInfo') as FormControl;
    this.reuseStep = this.dmpForm.get('reuse') as FormGroup;
    this.costsStep = this.dmpForm.get('costs') as FormGroup;

    this.projectStep.valueChanges.subscribe(newVal => {
      if (newVal) {
        const projectId = newVal.id;
        if (projectId) {
          this.getProjectMembers(projectId);
        }
      }
    });
  }

  changeStep(event: StepperSelectionEvent) {
    if (event.selectedIndex === 7) {
      this.getRepositories();
    }
  }

// TODO: make sure users can only retrieve dmps they are authorized to
  getDmpById(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    if (id) {
      console.log('Get DMP with ID: ' + id);
      this.backendService.getDmpById(id).subscribe(
        dmp => {
          this.formService.mapDmpToForm(dmp, this.dmpForm);
        });
    }
  }

  saveDmp(): void {
    console.log(this.userId);
    if (this.userId !== undefined) {
      if (this.dmpForm.value.id) {
        // TODO: reload page after update
        this.backendService.editDmp(this.userId, this.formService.exportFormToDmp(this.dmpForm));
      } else {
        this.backendService.createDmp(this.userId, this.formService.exportFormToDmp(this.dmpForm))
          .subscribe(newId => this.router.navigate([`${newId.id}`], {relativeTo: this.route}));
      }
    }
  }

  changeProject(project: Project) {
    if (project != null) {
      this.projectStep.setValue(project);
    } else {
      this.projectStep.reset();
    }
  }

  changeContactPerson(contact: Person) {
    if (contact != null) {
      this.contactStep.setValue(contact);
    } else {
      this.contactStep.reset();
    }
  }

  addContributor(contributor: Person) {
    this.formService.addContributorToForm(this.dmpForm, contributor);
    this.filterPeople();
  }

  removeContributor(index: number) {
    this.formService.removeContributorFromForm(this.dmpForm, index);
    this.filterPeople();
  }

  createDataset(title: string) {
    const dataset = this.formService.createDatasetFormGroup(title);
    dataset.patchValue({referenceHash: this.userId + (+new Date()).toString(36)});
    this.datasets.push(dataset);
  }

  updateDataset(event: { index: number, update: FormGroup }) {
    const dataset = this.datasets.at(event.index);
    dataset.patchValue(event.update.getRawValue());
  }

  removeDataset(index: number) {
    this.removeRepoDatasets(this.datasets.at(index));
    this.datasets.removeAt(index);
  }

  addStorage(storage: Storage) {
    this.formService.addStorageToForm(this.dmpForm, storage);
  }

  removeStorage(index: number): void {
    this.formService.removeStorageFromForm(this.dmpForm, index);
  }

  addExternalStorage() {
    this.formService.addExternalStorageToForm(this.dmpForm);
  }

  removeExternalStorage(index: number): void {
    this.formService.removeExternalStorageFromForm(this.dmpForm, index);
  }

  addRepository(repo: { id: string, name: string }) {
    this.formService.addRepositoryToForm(this.dmpForm, repo);
  }

  removeRepository(index: number): void {
    this.formService.removeRepositoryFromForm(this.dmpForm, index);
  }

  getRepositoryDetails(repo: Repository) {
    if (!repo.info) {
      this.store.dispatch(new LoadRepository({id: repo.id}));
    }
  }

  addCost() {
    this.formService.addCostToForm(this.dmpForm);
  }

  removeCost(index: number) {
    this.formService.removeCostFromForm(this.dmpForm, index);
  }

  private getSuggestedProjects(userId: string) {
    this.store.dispatch(new LoadSuggestedProjects({userId}));
  }

  private getProjectMembers(projectId: number) {
    this.backendService.getProjectMembers(projectId)
      .subscribe(members => {
        this.people = members;
        this.filterPeople();
      });
  }

  private filterPeople(): void {
    this.peopleList = Object.assign([], this.people);
    if (this.contributorStep != null && this.contributorStep.length > 0) {
      for (const entry of this.contributorStep.controls) {
        this.peopleList = this.peopleList.filter(e => e.person !== entry.value.person);
      }
    }
  }

  private removeRepoDatasets(dataset) {
    for (let i = 0; i < this.repoStep.controls.length; i++) {
      const host = this.repoStep.at(i);
      for (let j = 0; j < host.value.datasets.length; j++) {
        const repoDataset = host.value.datasets[j];
        if (dataset.value.referenceHash === repoDataset.referenceHash) {
          host.value.datasets.slice(j, 1);
        }
      }
    }
  }

  getRepositories() {
    this.repositoriesLoaded$.subscribe(loaded => {
      if (!loaded) {
        this.store.dispatch(new LoadRepositories());
      }
    });
  }
}
