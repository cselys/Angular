import { inject, Injectable, signal } from '@angular/core';

import { Place } from './place.model';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);
  private errorService = inject(ErrorService);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places', 'Something is wrong in available places'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places', 
      'Something is wrong in user places')
      .pipe(tap({
        next: (userPlaces) => {this.userPlaces.set(userPlaces);},
      }));
  }

  addPlaceToUserPlaces(place: Place) {
    const prePlaces = this.userPlaces();
    if(!this.userPlaces().some((p) => p.id === place.id))
      this.userPlaces.update(prePlaces => [...prePlaces, place]);
    return this.httpClient.put('http://localhost:3000/user-places', {
      placeId: place.id,
    })
    .pipe(
      catchError((error) => {
        this.userPlaces.set(prePlaces);
        this.errorService.showError("Failed to store selected place");
        return throwError(() => new Error("Failed to store selected place"));
      })
    )
  }

  removeUserPlace(place: Place) {
    const prePlaces = this.userPlaces();
    if(prePlaces.some((p) => p.id === place.id))
      this.userPlaces.set(prePlaces.filter(p => p.id !== place.id));
    return this.httpClient.delete('http://localhost:3000/user-places'+place.id )
    .pipe(     
      catchError((error) => {
      this.userPlaces.set(prePlaces);
      this.errorService.showError("Failed to store selected place");
      return throwError(() => new Error("Failed to store selected place"));
    }));
  }

  private fetchPlaces(url: string, errorMsg: string){
    return this.httpClient
        .get<{places: Place[]}>(url)
        .pipe(
            map((resData) => resData.places), 
            catchError((error) => throwError(() => new Error(errorMsg))));
  }
}
