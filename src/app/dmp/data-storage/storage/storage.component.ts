import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TU_STORAGE} from './storage-list';
import {FormArray, FormGroup} from '@angular/forms';
import {Storage} from '../../../domain/storage';

@Component({
  selector: 'app-dmp-storage',
  templateUrl: './storage.component.html',
  styleUrls: ['./storage.component.css']
})
export class StorageComponent implements OnInit {

  @Input() dmpForm: FormGroup;
  @Input() storageStep: FormArray;
  @Input() datasets: FormArray;

  @Output() storageToAdd = new EventEmitter<Storage>();
  @Output() storageToRemove = new EventEmitter<number>();

  storage: Storage[] = TU_STORAGE;

  constructor() {
  }

  ngOnInit(): void {
  }

  addStorage(storage: Storage) {
    this.storageToAdd.emit(storage);
  }

  removeStorage(index: number) {
    this.storageToRemove.emit(index);
  }

}
