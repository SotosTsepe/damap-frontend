import {TestBed} from '@angular/core/testing';

import {FormService} from './form.service';
import {FormBuilder} from '@angular/forms';
import {Dmp} from '../domain/dmp';
import {DataAccessType} from '../domain/enum/data-access-type.enum';
import {DataKind} from '../domain/enum/data-kind.enum';
import {CostType} from '../domain/enum/cost-type.enum';
import {ContributorRole} from '../domain/enum/contributor-role.enum';
import {PersonIdType} from '../domain/enum/person-id-type.enum';

describe('FormService', () => {
  let service: FormService;
  let formbuilder: FormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    TestBed.configureTestingModule({providers: [FormBuilder]});
    service = TestBed.inject(FormService);
    formbuilder = TestBed.inject(FormBuilder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(formbuilder).toBeTruthy();
  });

  it('should export the same dmp as mapped to the form', () => {
    const dmp: Dmp = {
      closedAccessInfo: 'closed access info',
      committeeApproved: false,
      contact: {
        firstName: 'Max', id: 77, lastName: 'Mustermann', mbox: 'm.mustermann@university.ac.at', universityId: '12345', personId: null
      },
      contributors: [
        {
          id: 84, person: {
            firstName: 'Max', id: 85, lastName: 'Mustermann', mbox: 'm.mustermann@university.ac.at', universityId: '12345', personId: null
          }, role: ContributorRole.Editor
        },
        {
          id: 98,
          person: {
            firstName: 'Anna',
            id: 99,
            lastName: 'Musterfrau',
            mbox: 'm.musterfrau@university.ac.at',
            personId: {
              identifier: '0000-0000-0000-xxxx',
              type: PersonIdType.ORCID
            },
            universityId: '23456'
          },
          role: ContributorRole.ProjectManager
        }
      ],
      costs: [
        {
          currencyCode: 'EUR',
          customType: null,
          description: 'cost description',
          id: 103,
          title: 'New cost',
          type: CostType.database,
          value: 123
        }
      ],
      costsExist: true,
      dataGeneration: 'research data will be generated by conducting a survey',
      dataKind: DataKind.SPECIFY,
      datasets: [
        {
          comment: '',
          dataAccess: DataAccessType.open,
          id: 82,
          license: 'https://creativecommons.org/publicdomain/zero/1.0/',
          personalData: true,
          sensitiveData: true,
          legalRestrictions: true,
          referenceHash: '39608knzrof6y',
          size: 0,
          startDate: null,
          title: 'Dataset 1',
          type: 'STANDARD_OFFICE_DOCUMENTS'
        }
      ],
      ethicalComplianceStatement: 'statement regarding ethical compliance',
      ethicalIssuesExist: false,
      ethicsReport: 'link.to.report',
      externalStorage: [
        // TODO
        /*{
          hostId: 'TU Files',
          backupFrequency: 'Wien',
          backupLocation: null,
          datasets: [
            '39608ko19edx5'
          ],
          id: null,
          storageLocation: null,
          title: 'OtherStorage',
          url: 'github.com'
        }*/
      ],
      externalStorageInfo: 'because',
      hosts: [
        {datasets: [
            '39608knzrof6y'
          ],
          date: new Date(),
          hostId: 'r3d100013557',
          id: 94,
          title: 'TU Data'
        },
      ],
      id: 76,
      legalRestrictions: false,
      legalRestrictionsComment: 'legally restricted',
      metadata: 'provided metadata',
      noDataExplanation: 'no data will be generated',
      personalData: false,
      personalDataAccess: 'only people with access can access',
      personalDataCompliance: ['item1', 'item2'],
      otherPersonalDataCompliance: 'other measures',
      project: {
        end: new Date(),
        funding: {
          funderId: {
            identifier: '501100004955', type: 'FUNDREF'
          }, fundingStatus: 'GRANTED',
          grantId: {
            identifier: '123456',
            type: null
          }, id: 79
        },
        id: 78,
        start: new Date(),
        title: 'Project title',
        universityId: 1234,
        description: '',
        dmpExists: false
      },
      restrictedAccessInfo: 'info how someone can access restricted data',
      restrictedDataAccess: 'send form',
      sensitiveData: true,
      sensitiveDataSecurity: 'data will be stored in a vault',
      storage: [
        {
          datasets: [
            '39608knzrof6y'
          ],
          hostId: '0',
          id: 97,
          title: 'TUfiles',
          // url: 'it.tuwien.ac.at'
        }
      ],
      structure: 'VCS',
      targetAudience: 'students',
      tools: 'proprietary software needed'
    };
    const form = service.createDmpForm();
    service.mapDmpToForm(dmp, form);
    expect(service.exportFormToDmp(form)).toEqual(dmp);
  })
});
